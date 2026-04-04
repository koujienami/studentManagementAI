package com.student.management.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.student.management.domain.HearingPublicApiPatterns;
import com.student.management.dto.ErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 公開の {@code /api/hearing/**} に対する簡易レート制限（IP 単位・固定ウィンドウ）。
 */
@Component
public class HearingRateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_GET_PER_WINDOW = 60;
    private static final int MAX_POST_ANSWERS_PER_WINDOW = 10;
    private static final long WINDOW_MILLIS = 60_000L;

    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<String, ConcurrentLinkedQueue<Long>> getByIp = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, ConcurrentLinkedQueue<Long>> postByIp = new ConcurrentHashMap<>();
    private final AtomicInteger pruneCounter = new AtomicInteger();

    public HearingRateLimitFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = HttpRequestSupport.requestPathWithoutContext(request);
        boolean hearingGet = isHearingSessionGet(request, path);
        boolean hearingPostAnswers = isHearingAnswersPost(request, path);

        if (!hearingGet && !hearingPostAnswers) {
            filterChain.doFilter(request, response);
            return;
        }

        long now = System.currentTimeMillis();
        maybePruneStaleEntries(now);

        String ip = HttpRequestSupport.resolveClientIp(request);
        ConcurrentHashMap<String, ConcurrentLinkedQueue<Long>> map = hearingGet ? getByIp : postByIp;
        int max = hearingGet ? MAX_GET_PER_WINDOW : MAX_POST_ANSWERS_PER_WINDOW;

        ConcurrentLinkedQueue<Long> times = map.computeIfAbsent(ip, k -> new ConcurrentLinkedQueue<>());

        synchronized (times) {
            while (!times.isEmpty() && now - times.peek() > WINDOW_MILLIS) {
                times.poll();
            }
            if (times.size() >= max) {
                response.setStatus(429);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setCharacterEncoding("UTF-8");
                objectMapper.writeValue(response.getWriter(),
                        new ErrorResponse(429, "リクエストが多すぎます。しばらくしてから再度お試しください。"));
                return;
            }
            times.add(now);
        }

        filterChain.doFilter(request, response);
    }

    private void maybePruneStaleEntries(long now) {
        if (pruneCounter.incrementAndGet() % 100 != 0) {
            return;
        }
        pruneMap(getByIp, now);
        pruneMap(postByIp, now);
    }

    private static void pruneMap(ConcurrentHashMap<String, ConcurrentLinkedQueue<Long>> map, long now) {
        map.entrySet().removeIf(entry -> {
            ConcurrentLinkedQueue<Long> q = entry.getValue();
            synchronized (q) {
                while (!q.isEmpty() && now - q.peek() > WINDOW_MILLIS) {
                    q.poll();
                }
                return q.isEmpty();
            }
        });
    }

    private static boolean isHearingSessionGet(HttpServletRequest request, String path) {
        if (!"GET".equalsIgnoreCase(request.getMethod())) {
            return false;
        }
        return HearingPublicApiPatterns.SESSION_GET.matcher(path).matches();
    }

    private static boolean isHearingAnswersPost(HttpServletRequest request, String path) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return false;
        }
        return HearingPublicApiPatterns.ANSWERS_POST.matcher(path).matches();
    }
}
