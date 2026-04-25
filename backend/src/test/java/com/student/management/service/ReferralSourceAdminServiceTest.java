package com.student.management.service;

import com.student.management.dto.referral.ReferralSourceRequest;
import com.student.management.entity.ReferralSource;
import com.student.management.exception.ApiException;
import com.student.management.repository.ReferralSourceMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReferralSourceAdminServiceTest {

    @Mock
    private ReferralSourceMapper referralSourceMapper;

    @InjectMocks
    private ReferralSourceAdminService service;

    @Test
    void create_insertsAndReturnsResponse() {
        when(referralSourceMapper.existsByName("LP")).thenReturn(false);
        doAnswer(inv -> {
            ReferralSource s = inv.getArgument(0);
            s.setId(20L);
            return null;
        }).when(referralSourceMapper).insert(any(ReferralSource.class));

        ReferralSource stored = new ReferralSource();
        stored.setId(20L);
        stored.setName("LP");
        stored.setCategory("WEB");
        stored.setDisplayOrder(5);
        when(referralSourceMapper.findById(20L)).thenReturn(Optional.of(stored));

        var response = service.create(new ReferralSourceRequest("LP", "WEB", 5));

        assertThat(response.id()).isEqualTo(20L);
        assertThat(response.deleted()).isFalse();

        ArgumentCaptor<ReferralSource> cap = ArgumentCaptor.forClass(ReferralSource.class);
        verify(referralSourceMapper).insert(cap.capture());
        assertThat(cap.getValue().getName()).isEqualTo("LP");
        assertThat(cap.getValue().getDisplayOrder()).isEqualTo(5);
    }

    @Test
    void create_whenNameDuplicated_throwsConflict() {
        when(referralSourceMapper.existsByName("LP")).thenReturn(true);

        assertThatThrownBy(() -> service.create(new ReferralSourceRequest("LP", "WEB", 1)))
                .isInstanceOf(ApiException.class)
                .extracting(ex -> ((ApiException) ex).getStatus())
                .isEqualTo(HttpStatus.CONFLICT);

        verify(referralSourceMapper, never()).insert(any());
    }

    @Test
    void update_whenNameDuplicatedExceptId_throwsConflict() {
        ReferralSource existing = active(3L, "Old");
        when(referralSourceMapper.findById(3L)).thenReturn(Optional.of(existing));
        when(referralSourceMapper.existsByNameExceptId("New", 3L)).thenReturn(true);

        assertThatThrownBy(() -> service.update(3L, new ReferralSourceRequest("New", "WEB", 2)))
                .isInstanceOf(ApiException.class)
                .extracting(ex -> ((ApiException) ex).getStatus())
                .isEqualTo(HttpStatus.CONFLICT);

        verify(referralSourceMapper, never()).update(any());
    }

    @Test
    void delete_softDeletes() {
        when(referralSourceMapper.findById(7L)).thenReturn(Optional.of(active(7L, "X")));

        service.delete(7L);

        verify(referralSourceMapper).softDelete(7L);
    }

    @Test
    void delete_whenAlreadyDeleted_throwsNotFound() {
        ReferralSource deleted = active(7L, "X");
        deleted.setDeletedAt(LocalDateTime.now());
        when(referralSourceMapper.findById(7L)).thenReturn(Optional.of(deleted));

        assertThatThrownBy(() -> service.delete(7L))
                .isInstanceOf(ApiException.class)
                .extracting(ex -> ((ApiException) ex).getStatus())
                .isEqualTo(HttpStatus.NOT_FOUND);

        verify(referralSourceMapper, never()).softDelete(anyLong());
    }

    private ReferralSource active(Long id, String name) {
        ReferralSource s = new ReferralSource();
        s.setId(id);
        s.setName(name);
        s.setCategory("WEB");
        s.setDisplayOrder(0);
        return s;
    }
}
