package com.devnear.web.service.user;

import com.devnear.web.domain.application.ProjectApplicationRepository;
import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.enums.ApplicationStatus;
import com.devnear.web.domain.enums.PaymentStatus;
import com.devnear.web.domain.enums.ProjectStatus;
import com.devnear.web.domain.enums.ProposalStatus;
import com.devnear.web.domain.enums.Role;
import com.devnear.web.domain.enums.UserStatus;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.payment.PaymentRepository;
import com.devnear.web.domain.portfolio.Portfolio;
import com.devnear.web.domain.portfolio.PortfolioRepository;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.domain.proposal.ProposalRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountWithdrawalServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProposalRepository proposalRepository;
    @Mock
    private ProjectApplicationRepository projectApplicationRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private PortfolioRepository portfolioRepository;

    @InjectMocks
    private AccountWithdrawalService service;

    @Test
    void alreadyWithdrawnUserThrows() {
        User user = org.mockito.Mockito.mock(User.class);
        when(userRepository.findByEmailForUpdate("x@test.com")).thenReturn(Optional.of(user));
        when(user.getStatus()).thenReturn(UserStatus.WITHDRAWN);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.withdrawByEmail("x@test.com"));
        assertEquals("이미 탈퇴 처리된 계정입니다.", ex.getMessage());
    }

    @Test
    void clientWithBlockingProjectThrows() {
        User user = org.mockito.Mockito.mock(User.class);
        ClientProfile clientProfile = org.mockito.Mockito.mock(ClientProfile.class);
        when(userRepository.findByEmailForUpdate("client@test.com")).thenReturn(Optional.of(user));
        when(user.getStatus()).thenReturn(UserStatus.ACTIVE);
        when(user.getRole()).thenReturn(Role.CLIENT);
        when(user.getClientProfile()).thenReturn(clientProfile);
        when(clientProfile.getId()).thenReturn(10L);
        when(projectRepository.existsByClientProfile_IdAndStatusIn(anyLong(), anyCollection())).thenReturn(true);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.withdrawByEmail("client@test.com"));
        assertEquals("모집 중이거나 진행 중인 공고가 있어 탈퇴할 수 없습니다. 먼저 마감·완료 처리해 주세요.", ex.getMessage());
    }

    @Test
    void freelancerWithPositiveBalanceThrows() {
        User user = org.mockito.Mockito.mock(User.class);
        FreelancerProfile freelancerProfile = org.mockito.Mockito.mock(FreelancerProfile.class);
        when(userRepository.findByEmailForUpdate("freelancer@test.com")).thenReturn(Optional.of(user));
        when(user.getStatus()).thenReturn(UserStatus.ACTIVE);
        when(user.getRole()).thenReturn(Role.FREELANCER);
        when(user.getFreelancerProfile()).thenReturn(freelancerProfile);
        when(freelancerProfile.getId()).thenReturn(99L);
        when(freelancerProfile.getBalance()).thenReturn(1000L);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.withdrawByEmail("freelancer@test.com"));
        assertEquals("정산 대기 중인 잔액이 있어 탈퇴할 수 없습니다.", ex.getMessage());
    }

    @Test
    void bothRoleSuccessScrubsProfilesAndAnonymizesUser() {
        User user = org.mockito.Mockito.mock(User.class);
        ClientProfile clientProfile = org.mockito.Mockito.mock(ClientProfile.class);
        FreelancerProfile freelancerProfile = org.mockito.Mockito.mock(FreelancerProfile.class);
        Portfolio pf = org.mockito.Mockito.mock(Portfolio.class);

        when(userRepository.findByEmailForUpdate("both@test.com")).thenReturn(Optional.of(user));
        when(user.getStatus()).thenReturn(UserStatus.ACTIVE);
        when(user.getRole()).thenReturn(Role.BOTH);
        when(user.getId()).thenReturn(7L);
        when(user.getClientProfile()).thenReturn(clientProfile);
        when(user.getFreelancerProfile()).thenReturn(freelancerProfile);
        when(clientProfile.getId()).thenReturn(11L);
        when(freelancerProfile.getId()).thenReturn(22L);
        when(freelancerProfile.getBalance()).thenReturn(0L);
        when(passwordEncoder.encode(ArgumentMatchers.startsWith("WITHDRAWN_"))).thenReturn("encoded");

        when(projectRepository.existsByClientProfile_IdAndStatusIn(anyLong(), anyCollection())).thenReturn(false);
        when(proposalRepository.existsByClientProfile_IdAndStatus(anyLong(), any(ProposalStatus.class))).thenReturn(false);
        when(projectApplicationRepository.existsByProjectClientProfile_IdAndApplicationStatus(anyLong(), any(ApplicationStatus.class))).thenReturn(false);
        when(projectRepository.existsByFreelancerProfile_IdAndStatusIn(anyLong(), anyCollection())).thenReturn(false);
        when(proposalRepository.existsByFreelancerProfile_IdAndStatus(anyLong(), any(ProposalStatus.class))).thenReturn(false);
        when(projectApplicationRepository.existsByFreelancerProfile_IdAndStatus(anyLong(), any(ApplicationStatus.class))).thenReturn(false);
        when(paymentRepository.existsByProject_FreelancerProfile_IdAndStatusNotIn(anyLong(), anyCollection())).thenReturn(false);
        when(portfolioRepository.findByUserIdWithSkills(7L)).thenReturn(List.of(pf));

        assertDoesNotThrow(() -> service.withdrawByEmail("both@test.com"));

        verify(portfolioRepository).deleteAll(any());
        verify(clientProfile).anonymizeForWithdrawal();
        verify(freelancerProfile).scrubPersonalDataForWithdrawal();
        verify(user).markWithdrawnAndAnonymize("withdrawn-u7@account-withdrawn.invalid", "withdrawn-u7", "encoded");
        verify(userRepository, never()).save(any());
    }
}

