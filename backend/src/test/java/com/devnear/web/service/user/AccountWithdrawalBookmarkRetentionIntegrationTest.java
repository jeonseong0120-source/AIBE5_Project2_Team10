package com.devnear.web.service.user;

import com.devnear.web.domain.bookmark.BookmarkFreelancer;
import com.devnear.web.domain.bookmark.BookmarkFreelancerRepository;
import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.client.ClientProfileRepository;
import com.devnear.web.domain.enums.Role;
import com.devnear.web.domain.enums.UserStatus;
import com.devnear.web.domain.freelancer.FreelancerGrade;
import com.devnear.web.domain.freelancer.FreelancerGradeRepository;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class AccountWithdrawalBookmarkRetentionIntegrationTest {

    @Autowired
    private AccountWithdrawalService accountWithdrawalService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ClientProfileRepository clientProfileRepository;
    @Autowired
    private FreelancerGradeRepository freelancerGradeRepository;
    @Autowired
    private FreelancerProfileRepository freelancerProfileRepository;
    @Autowired
    private BookmarkFreelancerRepository bookmarkFreelancerRepository;

    @Test
    void freelancerWithdrawal_keepsBookmarkRowsPointingAtProfile() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        User clientUser = userRepository.save(User.builder()
                .email("bm-client-" + suffix + "@test.dev")
                .password("pw")
                .name("클라")
                .nickname("bc-" + suffix)
                .role(Role.CLIENT)
                .provider("test")
                .providerId("pcc-" + suffix)
                .build());

        ClientProfile clientProfile = clientProfileRepository.save(ClientProfile.builder()
                .user(clientUser)
                .companyName("Co " + suffix)
                .bn("BMC" + suffix)
                .build());

        User freelancerUser = userRepository.save(User.builder()
                .email("bm-fl-" + suffix + "@test.dev")
                .password("pw")
                .name("프리")
                .nickname("bf-" + suffix)
                .role(Role.FREELANCER)
                .provider("test")
                .providerId("bcf-" + suffix)
                .build());

        FreelancerGrade grade = freelancerGradeRepository.save(FreelancerGrade.builder()
                .name("G-bm-" + suffix)
                .build());

        FreelancerProfile freelancerProfile = freelancerProfileRepository.save(FreelancerProfile.builder()
                .user(freelancerUser)
                .introduction("소개")
                .grade(grade)
                .build());

        bookmarkFreelancerRepository.save(BookmarkFreelancer.builder()
                .clientProfile(clientProfile)
                .freelancerProfile(freelancerProfile)
                .build());
        bookmarkFreelancerRepository.flush();

        Long freelancerProfileId = freelancerProfile.getId();

        accountWithdrawalService.withdrawByEmail(freelancerUser.getEmail());
        userRepository.flush();
        bookmarkFreelancerRepository.flush();

        User withdrawn = userRepository.findById(freelancerUser.getId()).orElseThrow();
        assertThat(withdrawn.getStatus()).isEqualTo(UserStatus.WITHDRAWN);

        assertThat(freelancerProfileRepository.findById(freelancerProfileId)).isPresent();

        FreelancerProfile fp = freelancerProfileRepository.findById(freelancerProfileId).orElseThrow();
        assertThat(bookmarkFreelancerRepository.findByClientProfileAndFreelancerProfile(clientProfile, fp))
                .isPresent();
    }
}
