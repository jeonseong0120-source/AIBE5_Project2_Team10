package com.devnear.web.controller.review;

import com.devnear.web.domain.user.User;
import com.devnear.web.dto.review.ClientReviewCreateRequest;
import com.devnear.web.dto.review.FreelancerReviewCreateRequest;
import com.devnear.web.dto.review.ReviewResponse;
import com.devnear.web.service.review.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.devnear.global.auth.LoginUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = {"/api/reviews", "/api/v1/reviews"})
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/freelancers")
    public ResponseEntity<Long> createFreelancerReview(@LoginUser User user,
                                                       @RequestBody FreelancerReviewCreateRequest request) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createFreelancerReview(user, request));
    }

    @PostMapping("/clients")
    public ResponseEntity<Long> createClientReview(@LoginUser User user,
                                                   @RequestBody ClientReviewCreateRequest request) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createClientReview(user, request));
    }

    @GetMapping("/freelancers/{freelancerId}")
    public ResponseEntity<List<ReviewResponse>> findFreelancerReviews(@PathVariable Long freelancerId) {
        return ResponseEntity.ok(reviewService.findFreelancerReviews(freelancerId));
    }

    @GetMapping("/clients/{clientId}")
    public ResponseEntity<List<ReviewResponse>> findClientReviews(@PathVariable Long clientId) {
        return ResponseEntity.ok(reviewService.findClientReviews(clientId));
    }
}