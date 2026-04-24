package com.devnear.web.controller.client;

import com.devnear.web.domain.user.User;
import com.devnear.web.dto.client.ClientProfileRequest;
import com.devnear.web.dto.client.ClientProfileResponse;
import com.devnear.web.service.client.ClientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.devnear.global.auth.LoginUser;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Client", description = "클라이언트(의뢰인) 프로필 관련 API")
@RestController
@RequestMapping("/api/client")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @Operation(summary = "클라이언트 프로필 등록", description = "로그인한 유저의 기업/의뢰인 정보를 등록합니다.")
    @PostMapping("/profile")
    public ResponseEntity<Long> registerProfile(
            @LoginUser User user,
            @RequestBody @Valid ClientProfileRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(clientService.registerProfile(user, request));
    }

    @Operation(summary = "클라이언트 프로필 조회", description = "로그인한 유저 본인의 기업 프로필 정보를 가져옵니다.")
    @GetMapping("/profile")
    public ResponseEntity<ClientProfileResponse> getMyProfile(@LoginUser User user) {
        try {
            // 🎯 [방어 로직] 프로필이 없다고 바로 에러를 터뜨리지 말고, 빈 결과를 주거나 204를 보냅니다.
            ClientProfileResponse response = clientService.getMyProfile(user);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // 아직 트랜잭션이 처리 중이거나 프로필이 없는 경우 404 대신 204(No Content)를 반환하여 프론트가 죽지 않게 합니다.
            return ResponseEntity.noContent().build();
        }
    }

    @Operation(summary = "클라이언트 프로필 수정", description = "로그인한 유저 본인의 기업 정보를 수정합니다.")
    @PutMapping("/profile")
    public ResponseEntity<Void> updateProfile(
            @LoginUser User user,
            @RequestBody @Valid ClientProfileRequest request) {
        clientService.updateProfile(user, request);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "클라이언트 프로필 삭제", description = "로그인한 유저의 클라이언트 프로필 정보를 삭제합니다.")
    @DeleteMapping("/profile")
    public ResponseEntity<Void> deleteProfile(
            @LoginUser User user) {
        clientService.deleteProfile(user);
        return ResponseEntity.noContent().build();
    }
}