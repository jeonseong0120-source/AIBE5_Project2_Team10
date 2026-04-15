package com.devnear.web.service.client;

import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.client.ClientProfileRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import com.devnear.web.dto.client.ClientProfileRequest;
import com.devnear.web.dto.client.ClientProfileResponse;
import com.devnear.web.exception.DuplicateProfileException;
import com.devnear.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClientService {

    private final ClientProfileRepository clientProfileRepository;
    private final UserRepository userRepository;

    @Transactional
    public Long registerProfile(User user, ClientProfileRequest request) {
        if (clientProfileRepository.existsByUser(user)) {
            throw new DuplicateProfileException("이미 프로필이 등록된 사용자입니다.");
        }
        if (clientProfileRepository.existsByBn(request.getBn())) {
            throw new DuplicateProfileException("이미 등록된 사업자 번호입니다.");
        }

        if (request.getNickname() != null && userRepository.existsByNickname(request.getNickname())) {
            throw new DuplicateProfileException("이미 사용 중인 닉네임입니다.");
        }

        try {
            return clientProfileRepository.save(request.toEntity(user)).getId();
        } catch (DataIntegrityViolationException e) {
            throw new DuplicateProfileException("이미 등록된 프로필 또는 사업자 번호입니다.");
        }
    }

    public ClientProfileResponse getMyProfile(User user) {
        ClientProfile profile = clientProfileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("클라이언트 프로필을 찾을 수 없습니다."));
        return ClientProfileResponse.from(profile);
    }

    @Transactional
    public void updateProfile(User user, ClientProfileRequest request) {
        User managedUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

        ClientProfile profile = findProfileByUser(managedUser);

        if (clientProfileRepository.existsByBnAndIdNot(request.getBn(), profile.getId())){
            throw new DuplicateProfileException("이미 등록된 사업자 번호입니다.");
        }

        // [AI 리뷰 반영] 닉네임 변경 시, 현재 내 닉네임과 다른 경우에만 중복 검사를 수행
        if (request.getNickname() != null && !request.getNickname().equals(managedUser.getNickname())) {
            if (userRepository.existsByNickname(request.getNickname())) {
                throw new DuplicateProfileException("이미 사용 중인 닉네임입니다.");
            }
            // 중복이 아닐 경우에만 닉네임 업데이트
            managedUser.setNickname(request.getNickname());
        }

        profile.update(request);
    }

    @Transactional
    public void deleteProfile(User user) {
        clientProfileRepository.delete(findProfileByUser(user));
    }

    private ClientProfile findProfileByUser(User user) {
        return clientProfileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("클라이언트 프로필을 찾을 수 없습니다."));
    }
}
