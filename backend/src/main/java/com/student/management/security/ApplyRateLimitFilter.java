package com.student.management.security;

import com.fasterxml.jackson.databind.ObjectMapper;
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

/**
 * 公開の {@code POST /api/apply} に対する簡易レート制限（IP 単位・固定ウィンドウ）。
 */
@Component
public class ApplyRateLimitFilter extends OncePerRequestFilter {

    private static final String PATH = "/api/apply";
    private static final int MAX_REQUESTS_PER_WINDOW = 5;
    private static final long WINDOW_MILLIS = 60_000L;

    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<String, ConcurrentLinkedQueue<Long>> requestsByIp = new ConcurrentHashMap<>();

    public ApplyRateLimitFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!isApplyPost(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip = resolveClientIp(request);
        long now = System.currentTimeMillis();
        ConcurrentLinkedQueue<Long> times = requestsByIp.computeIfAbsent(ip, k -> new ConcurrentLinkedQueue<>());

        synchronized (times) {
            while (!times.isEmpty() && now - times.peek() > WINDOW_MILLIS) {
                times.poll();
            }
            if (times.size() >= MAX_REQUESTS_PER_WINDOW) {
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

    private static boolean isApplyPost(HttpServletRequest request) {
        return "POST".equalsIgnoreCase(request.getMethod())
                && PATH.equals(request.getRequestURI());
    }

    private static String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
