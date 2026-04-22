package com.devnear.web.controller.review;

import com.devnear.web.domain.user.User;
import com.devnear.web.dto.review.ClientReviewCreateRequest;
import com.devnear.web.dto.review.FreelancerReviewCreateRequest;
import com.devnear.web.dto.review.ReviewResponse;
import com.devnear.web.service.review.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = {"/api/reviews", "/api/v1/reviews"})
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/freelancers")
    public ResponseEntity<Long> createFreelancerReview(@AuthenticationPrincipal User user,
                                                       @RequestBody FreelancerReviewCreateRequest request) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createFreelancerReview(user, request));
    }

    @PostMapping("/clients")
    public ResponseEntity<Long> createClientReview(@AuthenticationPrincipal User user,
                                                   @RequestBody ClientReviewCreateRequest request) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createClientReview(user, request));
    }

    @GetMapping("/freelancers/{freelancerId}")
    public ResponseEntity<?> findFreelancerReviews(@PathVariable Long freelancerId) {
        try {
            return ResponseEntity.ok(reviewService.findFreelancerReviews(freelancerId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error details: " + e.getMessage());
        }
    }

    @GetMapping("/clients/{clientId}")
    public ResponseEntity<List<ReviewResponse>> findClientReviews(@PathVariable Long clientId) {
        return ResponseEntity.ok(reviewService.findClientReviews(clientId));
    }
}