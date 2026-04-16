package com.devnear.web.service.chat;

import com.devnear.web.domain.chat.ChatMessage;
import com.devnear.web.domain.chat.ChatMessageRepository;
import com.devnear.web.domain.chat.ChatRoom;
import com.devnear.web.domain.chat.ChatRoomRepository;
import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import com.devnear.web.dto.chat.ChatMessageResponse;
import com.devnear.web.dto.chat.ChatMessageSendRequest;
import com.devnear.web.dto.chat.ChatRoomCreateRequest;
import com.devnear.web.dto.chat.ChatRoomListResponse;
import com.devnear.web.dto.chat.ChatRoomResponse;
import com.devnear.web.exception.ChatAccessDeniedException;
import com.devnear.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    // 채팅방 생성
    @Transactional
    public ChatRoomResponse createRoom(User me, ChatRoomCreateRequest request) {

        // 자기 자신과 채팅방 만드는 건 막기
        if (me.getId().equals(request.getTargetUserId())) {
            throw new IllegalArgumentException("자기 자신과는 채팅방을 만들 수 없습니다.");
        }

        // 상대 유저 조회
        User target = userRepository.findById(request.getTargetUserId())
                .orElseThrow(() -> new ResourceNotFoundException("대상 유저를 찾을 수 없습니다."));

        // 프로젝트 조회
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("프로젝트를 찾을 수 없습니다."));

        // 프로젝트 참여자 여부 검사: me와 target 모두 프로젝트의 클라이언트 또는 프리랜서여야 함
        boolean meIsParticipant = (project.getClientProfile() != null && project.getClientProfile().getUser().getId().equals(me.getId()))
                || (project.getFreelancerProfile() != null && project.getFreelancerProfile().getUser().getId().equals(me.getId()));
        boolean targetIsParticipant = (project.getClientProfile() != null && project.getClientProfile().getUser().getId().equals(target.getId()))
                || (project.getFreelancerProfile() != null && project.getFreelancerProfile().getUser().getId().equals(target.getId()));

        if (!meIsParticipant || !targetIsParticipant) {
            throw new ChatAccessDeniedException("프로젝트 참여자만 채팅을 생성할 수 있습니다.");
        }

        // user1, user2 순서를 고정해야 unique 제약조건이 제대로 동작함
        // 예: (1, 7)과 (7, 1)을 같은 채팅방으로 보기 위해 정렬
        User first = me.getId() < target.getId() ? me : target;
        User second = me.getId() < target.getId() ? target : me;

        // 이미 같은 프로젝트 + 같은 두 유저 조합의 채팅방이 있으면 기존 방 반환
        ChatRoom room = chatRoomRepository.findByProjectAndUser1AndUser2(project, first, second)
                .orElse(null);

        if (room == null) {
            try {
                room = chatRoomRepository.save(
                        ChatRoom.builder()
                                .project(project)
                                .user1(first)
                                .user2(second)
                                .build()
                );
            } catch (DataIntegrityViolationException e) {
                room = chatRoomRepository.findByProjectAndUser1AndUser2(project, first, second)
                        .orElseThrow(() -> e);
            }
        }

        return ChatRoomResponse.from(room, me);
    }

    // 내 채팅방 목록 조회
    public List<ChatRoomListResponse> getMyRooms(User me) {
        List<ChatRoom> rooms = chatRoomRepository.findAllByUser1OrUser2OrderByUpdatedAtDesc(me, me);

        return rooms.stream()
                .map(room -> {
                    // 각 채팅방의 마지막 메시지 조회
                    ChatMessage lastMessage = chatMessageRepository
                            .findTopByChatRoomOrderByCreatedAtDesc(room)
                            .orElse(null);

                    // 안 읽은 메시지 개수 조회
                    long unreadCount = chatMessageRepository
                            .countByChatRoomAndSenderNotAndIsReadFalse(room, me);

                    return ChatRoomListResponse.of(room, me, lastMessage, unreadCount);
                })
                // 마지막 메시지 시간이 최신인 순서대로 정렬
                .sorted(Comparator.comparing(
                        ChatRoomListResponse::getLastMessageAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .toList();
    }

    // 특정 채팅방의 메시지 전체 조회
    public List<ChatMessageResponse> getMessages(User me, Long roomId) {
        ChatRoom room = getValidatedRoom(me, roomId);

        return chatMessageRepository.findAllByChatRoomOrderByCreatedAtAsc(room)
                .stream()
                .map(ChatMessageResponse::from)
                .toList();
    }

    // 읽음 처리
    @Transactional
    public void markAsRead(User me, Long roomId) {
        ChatRoom room = getValidatedRoom(me, roomId);

        // 내가 받은 메시지 중 아직 안 읽은 메시지만 조회
        List<ChatMessage> unreadMessages =
                chatMessageRepository.findByChatRoomAndSenderNotAndIsReadFalse(room, me);

        // 모두 읽음 처리
        unreadMessages.forEach(ChatMessage::markAsRead);
    }

    // 메시지 저장
    @Transactional
    public ChatMessageResponse saveMessage(User me, ChatMessageSendRequest request) {
        ChatRoom room = getValidatedRoom(me, request.getRoomId());

        // 공백 메시지 방지
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("메시지 내용은 비어 있을 수 없습니다.");
        }

        // 메시지 저장
        ChatMessage message = chatMessageRepository.save(
                ChatMessage.builder()
                        .chatRoom(room)
                        .sender(me)
                        .content(request.getContent().trim())
                        .build()
        );

        return ChatMessageResponse.from(message);
    }

    // 채팅방 존재 여부 + 참여 권한 검사
    private ChatRoom getValidatedRoom(User me, Long roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("채팅방을 찾을 수 없습니다."));

        // 해당 유저가 참여자가 아니라면 접근 금지
        boolean isParticipant =
                               room.getUser1().getId().equals(me.getId()) ||
                                       room.getUser2().getId().equals(me.getId());
                if (!isParticipant){
                    throw new ChatAccessDeniedException("해당 채팅방에 접근할 권한이 없습니다.");
        }

        return room;
    }
}