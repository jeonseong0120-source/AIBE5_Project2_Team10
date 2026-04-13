package com.devnear.web.service.bookmark;

import com.devnear.web.domain.bookmark.BookmarkFreelancer;
import com.devnear.web.domain.bookmark.BookmarkFreelancerRepository;
import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.client.ClientProfileRepository;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.portfolio.Portfolio;
import com.devnear.web.domain.portfolio.PortfolioRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.dto.freelancer.FreelancerProfileResponse;
import com.devnear.web.exception.DuplicateProfileException;
import com.devnear.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class BookmarkService {

    private final BookmarkFreelancerRepository bookmarkFreelancerRepository;
    // BookmarkPortfolioRepository 제거
    private final ClientProfileRepository clientProfileRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;
    private final PortfolioRepository portfolioRepository;

    // ── 프리랜서 찜 ──

    @Transactional
    public void addFreelancerBookmark(User user, Long freelancerProfileId) {
        ClientProfile clientProfile = findClientProfileByUser(user);
        FreelancerProfile freelancerProfile = freelancerProfileRepository.findById(freelancerProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("프리랜서 프로필을 찾을 수 없습니다."));
        try {
            bookmarkFreelancerRepository.save(BookmarkFreelancer.builder()
                    .clientProfile(clientProfile)
                    .freelancerProfile(freelancerProfile)
                    .build());
        } catch (DataIntegrityViolationException e) {
            throw new DuplicateProfileException("이미 찜한 프리랜서입니다.");
        }
    }

    @Transactional
    public void removeFreelancerBookmark(User user, Long freelancerProfileId) {
        ClientProfile clientProfile = findClientProfileByUser(user);
        FreelancerProfile freelancerProfile = freelancerProfileRepository.findById(freelancerProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("프리랜서 프로필을 찾을 수 없습니다."));

        BookmarkFreelancer bookmark = bookmarkFreelancerRepository
                .findByClientProfileAndFreelancerProfile(clientProfile, freelancerProfile)
                .orElseThrow(() -> new ResourceNotFoundException("찜한 프리랜서가 아닙니다."));

        bookmarkFreelancerRepository.delete(bookmark);
    }

    public Page<FreelancerProfileResponse> getBookmarkedFreelancers(User user, Pageable pageable) {
        ClientProfile clientProfile = findClientProfileByUser(user);
        return bookmarkFreelancerRepository.findAllByClientProfile(clientProfile, pageable)
                .map(bookmark -> FreelancerProfileResponse.from(bookmark.getFreelancerProfile()));
    }

    // ── 포트폴리오 좋아요 (프리랜서 찜으로 처리) ──

    @Transactional
    public void likePortfolio(User user, Long portfolioId) {
        ClientProfile clientProfile = findClientProfileByUser(user);
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("포트폴리오를 찾을 수 없습니다."));
        FreelancerProfile freelancerProfile = freelancerProfileRepository.findByUser_Id(portfolio.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("프리랜서 프로필을 찾을 수 없습니다."));
        try {
            bookmarkFreelancerRepository.save(BookmarkFreelancer.builder()
                    .clientProfile(clientProfile)
                    .freelancerProfile(freelancerProfile)
                    .build());
        } catch (DataIntegrityViolationException e) {
            throw new DuplicateProfileException("이미 찜한 프리랜서입니다.");
        }
    }

    @Transactional
    public void unlikePortfolio(User user, Long portfolioId) {
        ClientProfile clientProfile = findClientProfileByUser(user);
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("포트폴리오를 찾을 수 없습니다."));
        FreelancerProfile freelancerProfile = freelancerProfileRepository.findByUser_Id(portfolio.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("프리랜서 프로필을 찾을 수 없습니다."));
        BookmarkFreelancer bookmark = bookmarkFreelancerRepository
                .findByClientProfileAndFreelancerProfile(clientProfile, freelancerProfile)
                .orElseThrow(() -> new ResourceNotFoundException("찜한 프리랜서가 아닙니다."));
        bookmarkFreelancerRepository.delete(bookmark);
    }

    // ── 헬퍼 ──

    private ClientProfile findClientProfileByUser(User user) {
        return clientProfileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("클라이언트 프로필이 등록되지 않았습니다."));
    }
}