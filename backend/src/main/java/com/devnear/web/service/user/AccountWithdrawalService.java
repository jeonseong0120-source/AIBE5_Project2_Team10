package com.devnear.web.service.user;

import com.devnear.web.domain.application.ProjectApplicationRepository;
import com.devnear.web.domain.enums.ApplicationStatus;
import com.devnear.web.domain.enums.PaymentStatus;
import com.devnear.web.domain.enums.ProjectStatus;
import com.devnear.web.domain.enums.ProposalStatus;
import com.devnear.web.domain.enums.Role;
import com.devnear.web.domain.enums.UserStatus;
import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.client.ClientProfileRepository;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.payment.PaymentRepository;
import com.devnear.web.domain.portfolio.Portfolio;
import com.devnear.web.domain.portfolio.PortfolioRepository;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.domain.proposal.ProposalRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountWithdrawalService {

    private static final List<ProjectStatus> BLOCKING_PROJECT_STATUSES =
            List.of(ProjectStatus.OPEN, ProjectStatus.IN_PROGRESS);

    private static final List<PaymentStatus> PAYMENT_TERMINAL_STATUSES =
            List.of(PaymentStatus.SETTLED, PaymentStatus.CANCELED);

    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final ProjectRepository projectRepository;
    private final ProposalRepository proposalRepository;
    private final ProjectApplicationRepository projectApplicationRepository;
    private final PaymentRepository paymentRepository;
    private final PortfolioRepository portfolioRepository;

    @Transactional
    public void withdrawByEmail(String email) {
        User user = userRepository.findByEmailForUpdate(email)
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));
        if (user.getStatus() == UserStatus.WITHDRAWN) {
            throw new IllegalStateException("이미 탈퇴 처리된 계정입니다.");
        }
        if (user.getRole() == Role.GUEST) {
            throw new IllegalStateException("온보딩을 완료한 뒤에만 회원 탈퇴를 할 수 있습니다.");
        }

        ClientProfile loadedClient = clientProfileRepository.findByUser_Id(user.getId()).orElse(null);
        FreelancerProfile loadedFreelancer = freelancerProfileRepository.findByUser_Id(user.getId()).orElse(null);
        user.attachManagedProfiles(loadedClient, loadedFreelancer);

        boolean asClient = user.getRole() == Role.CLIENT || user.getRole() == Role.BOTH;
        boolean asFreelancer = user.getRole() == Role.FREELANCER || user.getRole() == Role.BOTH;

        if (asClient) {
            if (user.getClientProfile() == null) {
                throw new IllegalStateException("클라이언트 프로필이 없어 탈퇴를 진행할 수 없습니다.");
            }
            assertClientMayWithdraw(user.getClientProfile().getId());
        }
        FreelancerProfile freelancerProfile = user.getFreelancerProfile();
        if (asFreelancer) {
            if (freelancerProfile == null) {
                throw new IllegalStateException("프리랜서 프로필이 없어 탈퇴를 진행할 수 없습니다.");
            }
            long balance = freelancerProfile.getBalance() != null ? freelancerProfile.getBalance() : 0L;
            assertFreelancerMayWithdraw(freelancerProfile.getId(), balance);
        }

        if (asFreelancer) {
            List<Portfolio> portfolios = portfolioRepository.findByUserIdWithSkills(user.getId());
            if (!portfolios.isEmpty()) {
                portfolioRepository.deleteAll(portfolios);
            }
        }

        if (asClient) {
            user.getClientProfile().anonymizeForWithdrawal();
        }
        if (asFreelancer) {
            freelancerProfile.scrubPersonalDataForWithdrawal();
        }

        String placeholderEmail = buildWithdrawnEmail(user.getId());
        String placeholderNickname = buildWithdrawnNickname(user.getId());
        String encodedPassword = passwordEncoder.encode("WITHDRAWN_" + UUID.randomUUID());
        user.markWithdrawnAndAnonymize(placeholderEmail, placeholderNickname, encodedPassword);
    }

    private static String buildWithdrawnEmail(long userId) {
        return "withdrawn-u" + userId + "@account-withdrawn.invalid";
    }

    private static String buildWithdrawnNickname(long userId) {
        return "withdrawn-u" + userId;
    }

    private void assertClientMayWithdraw(Long clientProfileId) {
        if (projectRepository.existsByClientProfile_IdAndStatusIn(clientProfileId, BLOCKING_PROJECT_STATUSES)) {
            throw new IllegalStateException("모집 중이거나 진행 중인 공고가 있어 탈퇴할 수 없습니다. 먼저 마감·완료 처리해 주세요.");
        }
        if (proposalRepository.existsByClientProfile_IdAndStatus(clientProfileId, ProposalStatus.PENDING)) {
            throw new IllegalStateException("검토 대기 중인 역제안이 있어 탈퇴할 수 없습니다.");
        }
        if (projectApplicationRepository.existsByProjectClientProfile_IdAndApplicationStatus(
                clientProfileId, ApplicationStatus.PENDING)) {
            throw new IllegalStateException("검토 대기 중인 지원이 남아 있어 탈퇴할 수 없습니다.");
        }
    }

    private void assertFreelancerMayWithdraw(Long freelancerProfileId, long balance) {
        if (balance > 0) {
            throw new IllegalStateException("정산 대기 중인 잔액이 있어 탈퇴할 수 없습니다.");
        }
        if (projectRepository.existsByFreelancerProfile_IdAndStatusIn(freelancerProfileId, BLOCKING_PROJECT_STATUSES)) {
            throw new IllegalStateException("진행 중이거나 모집 중인 담당 프로젝트가 있어 탈퇴할 수 없습니다.");
        }
        if (proposalRepository.existsByFreelancerProfile_IdAndStatus(freelancerProfileId, ProposalStatus.PENDING)) {
            throw new IllegalStateException("응답하지 않은 역제안이 있어 탈퇴할 수 없습니다.");
        }
        if (projectApplicationRepository.existsByFreelancerProfile_IdAndStatus(
                freelancerProfileId, ApplicationStatus.PENDING)) {
            throw new IllegalStateException("검토 대기 중인 지원이 있어 탈퇴할 수 없습니다.");
        }
        if (paymentRepository.existsByProject_FreelancerProfile_IdAndStatusNotIn(
                freelancerProfileId, PAYMENT_TERMINAL_STATUSES)) {
            throw new IllegalStateException("정산이 완료되지 않은 결제 건이 있어 탈퇴할 수 없습니다.");
        }
    }
}
