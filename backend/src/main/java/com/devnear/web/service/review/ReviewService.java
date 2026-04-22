package com.devnear.web.service.review;

import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.client.ClientProfileRepository;
import com.devnear.web.domain.enums.NotificationType;
import com.devnear.web.domain.enums.ProjectStatus;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.domain.review.ClientReview;
import com.devnear.web.domain.review.ClientReviewRepository;
import com.devnear.web.domain.review.FreelancerReview;
import com.devnear.web.domain.review.FreelancerReviewRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.dto.review.ClientReviewCreateRequest;
import com.devnear.web.dto.review.FreelancerReviewCreateRequest;
import com.devnear.web.dto.review.ReviewResponse;
import com.devnear.web.exception.ResourceConflictException;
import com.devnear.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.devnear.web.service.freelancer.FreelancerGradeService;
import com.devnear.web.service.notification.NotificationService;
import com.devnear.web.domain.payment.PaymentRepository;
import com.devnear.web.domain.payment.Payment;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final FreelancerReviewRepository freelancerReviewRepository;
    private final ClientReviewRepository clientReviewRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;
    private final ProjectRepository projectRepository;
    private final FreelancerGradeService freelancerGradeService;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;

    @Transactional
    public Long createFreelancerReview(User user, FreelancerReviewCreateRequest request) {
        // 로그인한 사용자의 클라이언트 프로필 조회
        ClientProfile reviewerClient = clientProfileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("클라이언트 프로필이 없습니다."));

        // 요청으로 들어온 프리랜서 프로필 조회
        FreelancerProfile freelancer = freelancerProfileRepository.findById(request.getFreelancerId())
                .orElseThrow(() -> new ResourceNotFoundException("프리랜서 프로필이 없습니다."));

        // 요청으로 들어온 프로젝트 조회
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("프로젝트를 찾을 수 없습니다."));

        // 완료된 프로젝트인지 확인
        validateCompletedProject(project);

        // 로그인한 사용자가 해당 프로젝트의 클라이언트인지 확인
        validateProjectOwner(project, reviewerClient);

        // [중요] 요청한 freelancerId가 실제 해당 프로젝트에 참여한 프리랜서인지 검증
        validateProjectFreelancer(project, freelancer);

        // 같은 프로젝트에 대해 같은 클라이언트가 같은 프리랜서에게 중복 리뷰 작성했는지 확인
        if (freelancerReviewRepository.existsByProjectIdAndReviewerClientAndFreelancer(
                request.getProjectId(), reviewerClient, freelancer)) {
            throw new ResourceConflictException("이미 해당 프로젝트에 대한 프리랜서 리뷰를 작성했습니다.");
        }

        // 점수 유효성 검증
        validateScore(request.getWorkQuality());
        validateScore(request.getDeadline());
        validateScore(request.getCommunication());
        validateScore(request.getExpertise());

        // 리뷰 생성
        FreelancerReview review = FreelancerReview.builder()
                .projectId(request.getProjectId())
                .reviewerClient(reviewerClient)
                .freelancer(freelancer)
                .workQuality(request.getWorkQuality())
                .deadline(request.getDeadline())
                .communication(request.getCommunication())
                .expertise(request.getExpertise())
                .comment(request.getComment())
                .build();

        // 저장 후 평점 및 등급 재계산 + 프로젝트 예산 정산 (지갑으로 입금)
        freelancerReviewRepository.save(review);
        // [정산 로직 변경] 프로젝트 예산이 아닌 실제 결제된 순 정산액(netAmount)을 기준으로 입금 처리
        Payment payment = paymentRepository.findByProjectId(project.getId())
                .orElseThrow(() -> new IllegalStateException("해당 프로젝트의 결제 정보를 찾을 수 없어 정산할 수 없습니다."));

        if (payment.getStatus() != com.devnear.web.domain.enums.PaymentStatus.DONE &&
            payment.getStatus() != com.devnear.web.domain.enums.PaymentStatus.PURCHASE_CONFIRMED) {
            throw new IllegalStateException("유효한 결제 완료 상태가 아닙니다.");
        }

        notificationService.notifyUser(
                freelancer.getUser().getId(),
                NotificationType.REVIEW_LEFT_BY_CLIENT,
                "새 리뷰",
                "클라이언트가 리뷰를 남겼습니다.",
                project.getId()
        );

        recomputeFreelancerAggregates(freelancer.getId(), payment.getNetAmount());

        notificationService.notifyUser(
                freelancer.getUser().getId(),
                NotificationType.FREELANCER_DEPOSIT_COMPLETED,
                "입금 완료",
                "입금이 완료되었습니다.",
                project.getId()
        );

        return review.getId();
    }

    @Transactional
    public Long createClientReview(User user, ClientReviewCreateRequest request) {
        // 로그인한 사용자의 프리랜서 프로필 조회
        FreelancerProfile reviewerFreelancer = freelancerProfileRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("프리랜서 프로필이 없습니다."));

        // 요청으로 들어온 클라이언트 프로필 조회
        ClientProfile client = clientProfileRepository.findById(request.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("클라이언트 프로필이 없습니다."));

        // 요청으로 들어온 프로젝트 조회
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("프로젝트를 찾을 수 없습니다."));

        // 완료된 프로젝트인지 확인
        validateCompletedProject(project);

        // 요청한 clientId가 실제 해당 프로젝트의 클라이언트인지 확인
        validateProjectClient(project, client);

        // [중요] 로그인한 프리랜서가 실제 해당 프로젝트에 참여한 프리랜서인지 검증
        validateProjectFreelancer(project, reviewerFreelancer);

        // 같은 프로젝트에 대해 같은 프리랜서가 같은 클라이언트에게 중복 리뷰 작성했는지 확인
        if (clientReviewRepository.existsByProjectIdAndReviewerFreelancerAndClient(
                request.getProjectId(), reviewerFreelancer, client)) {
            throw new ResourceConflictException("이미 해당 프로젝트에 대한 클라이언트 리뷰를 작성했습니다.");
        }

        // 점수 유효성 검증
        validateScore(request.getRequirementClarity());
        validateScore(request.getCommunication());
        validateScore(request.getPaymentReliability());
        validateScore(request.getWorkAttitude());

        // 리뷰 생성
        ClientReview review = ClientReview.builder()
                .projectId(request.getProjectId())
                .reviewerFreelancer(reviewerFreelancer)
                .client(client)
                .requirementClarity(request.getRequirementClarity())
                .communication(request.getCommunication())
                .paymentReliability(request.getPaymentReliability())
                .workAttitude(request.getWorkAttitude())
                .comment(request.getComment())
                .build();

        // 저장 후 평점 재계산
        clientReviewRepository.save(review);
        updateClientRating(client);

        notificationService.notifyUser(
                client.getUser().getId(),
                NotificationType.REVIEW_LEFT_BY_FREELANCER,
                "새 리뷰",
                "프리랜서가 리뷰를 남겼습니다.",
                project.getId()
        );

        return review.getId();
    }

    public List<ReviewResponse> findFreelancerReviews(Long freelancerId) {
        FreelancerProfile freelancer = freelancerProfileRepository.findById(freelancerId)
                .orElseThrow(() -> new ResourceNotFoundException("프리랜서 프로필이 없습니다."));

        return freelancerReviewRepository.findByFreelancer(freelancer).stream()
                .map(review -> new ReviewResponse(
                        review.getId(),
                        review.getAverageScore(),
                        review.getComment(),
                        review.getWorkQuality(),
                        review.getDeadline(),
                        review.getCommunication(),
                        review.getExpertise(),
                        null,
                        null,
                        null
                ))
                .toList();
    }

    public List<ReviewResponse> findClientReviews(Long clientId) {
        ClientProfile client = clientProfileRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("클라이언트 프로필이 없습니다."));

        return clientReviewRepository.findByClient(client).stream()
                .map(review -> new ReviewResponse(
                        review.getId(),
                        review.getAverageScore(),
                        review.getComment(),
                        null,
                        null,
                        review.getCommunication(),
                        null,
                        review.getRequirementClarity(),
                        review.getPaymentReliability(),
                        review.getWorkAttitude()
                ))
                .toList();
    }

    @Transactional
    public void updateFreelancerRating(FreelancerProfile freelancer) {
        List<FreelancerReview> reviews = freelancerReviewRepository.findByFreelancer(freelancer);

        if (reviews.isEmpty()) {
            freelancer.updateAverageRating(0.0);
            freelancer.updateReviewCount(0);
            return;
        }

        BigDecimal average = reviews.stream()
                .map(FreelancerReview::getAverageScore)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(reviews.size()), 2, RoundingMode.HALF_UP);

        freelancer.updateAverageRating(average.doubleValue());
        freelancer.updateReviewCount(reviews.size());
    }

    /**
     * Recompute aggregates with pessimistic lock to avoid lost updates when multiple reviews are created concurrently.
     */
    @Transactional
    public void recomputeFreelancerAggregates(Long freelancerId) {
        recomputeFreelancerAggregates(freelancerId, 0L);
    }

    @Transactional
    public void recomputeFreelancerAggregates(Long freelancerId, Long additionalBalance) {
        // obtain PESSIMISTIC_WRITE lock on freelancer profile
        FreelancerProfile locked = freelancerProfileRepository.findByIdForUpdate(freelancerId)
                .orElseThrow(() -> new ResourceNotFoundException("프리랜서 프로필이 없습니다."));

        if (additionalBalance != null && additionalBalance > 0) {
            locked.addBalance(additionalBalance);
        }

        List<FreelancerReview> reviews = freelancerReviewRepository.findByFreelancer(locked);

        if (reviews.isEmpty()) {
            locked.updateAverageRating(0.0);
            locked.updateReviewCount(0);
        } else {
            BigDecimal average = reviews.stream()
                    .map(FreelancerReview::getAverageScore)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(reviews.size()), 2, RoundingMode.HALF_UP);

            locked.updateAverageRating(average.doubleValue());
            locked.updateReviewCount(reviews.size());
        }

        // Refresh grade using the locked, managed entity so grade calculation uses latest persisted aggregates
        freelancerGradeService.refreshGrade(locked);
    }

    @Transactional
    public void updateClientRating(ClientProfile client) {
        List<ClientReview> reviews = clientReviewRepository.findByClient(client);

        if (reviews.isEmpty()) {
            client.updateRating(BigDecimal.ZERO);
            return;
        }

        BigDecimal average = reviews.stream()
                .map(ClientReview::getAverageScore)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(reviews.size()), 2, RoundingMode.HALF_UP);

        client.updateRating(average);
    }

    // 프로젝트가 완료 상태인지 확인
    private void validateCompletedProject(Project project) {
        if (project.getStatus() != ProjectStatus.COMPLETED) {
            throw new IllegalArgumentException("완료된 프로젝트만 리뷰할 수 있습니다.");
        }
    }

    // 로그인한 클라이언트가 실제 프로젝트 소유자인지 확인
    private void validateProjectOwner(Project project, ClientProfile reviewerClient) {
        if (!project.getClientProfile().getId().equals(reviewerClient.getId())) {
            throw new IllegalArgumentException("해당 프로젝트의 클라이언트만 프리랜서 리뷰를 작성할 수 있습니다.");
        }
    }

    // 요청한 클라이언트가 실제 프로젝트의 클라이언트인지 확인
    private void validateProjectClient(Project project, ClientProfile client) {
        if (!project.getClientProfile().getId().equals(client.getId())) {
            throw new IllegalArgumentException("해당 프로젝트의 클라이언트만 리뷰할 수 있습니다.");
        }
    }

    // [핵심 추가] 요청/로그인 프리랜서가 실제 프로젝트 참여 프리랜서인지 확인
    private void validateProjectFreelancer(Project project, FreelancerProfile freelancer) {
        if (project.getFreelancerProfile() == null) {
            throw new IllegalArgumentException("해당 프로젝트에 매칭된 프리랜서가 없습니다.");
        }

        if (!project.getFreelancerProfile().getId().equals(freelancer.getId())) {
            throw new IllegalArgumentException("해당 프로젝트에 참여한 프리랜서만 리뷰할 수 있습니다.");
        }
    }

    // 별점 검증
    private void validateScore(BigDecimal score) {
        if (score == null) {
            throw new IllegalArgumentException("별점은 필수입니다.");
        }

        if (score.compareTo(BigDecimal.valueOf(0.5)) < 0 ||
                score.compareTo(BigDecimal.valueOf(5.0)) > 0) {
            throw new IllegalArgumentException("별점은 0.5 이상 5.0 이하만 가능합니다.");
        }

        if (score.remainder(BigDecimal.valueOf(0.5)).compareTo(BigDecimal.ZERO) != 0) {
            throw new IllegalArgumentException("별점은 0.5 단위로만 입력 가능합니다.");
        }
    }
}