package com.devnear.web.service.chat;

import com.devnear.web.domain.chat.ChatMessage;
import com.devnear.web.domain.chat.ChatMessageRepository;
import com.devnear.web.domain.chat.ChatRoom;
import com.devnear.web.domain.chat.ChatRoomRepository;
import com.devnear.web.domain.enums.NotificationType;
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
import com.devnear.web.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final NotificationService notificationService;
    private final ApplicationEventPublisher eventPublisher;

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

        AtomicBoolean createdNew = new AtomicBoolean(false);
        ChatRoom room = resolveOrCreateChatRoom(project, me, target, createdNew);
        if (createdNew.get()) {
            notificationService.notifyUser(
                    target.getId(),
                    NotificationType.CHAT_ROOM_CREATED,
                    "새 문의 채팅방",
                    me.getNickname() + " 님이 '" + project.getProjectName() + "' 문의 채팅방을 만들었습니다.",
                    room.getId()
            );
        }
        return ChatRoomResponse.from(room, me);
    }

    /**
     * 프로젝트 등록 클라이언트와 지정 프리랜서 간 채팅방을 조회하거나 생성합니다.
     * 제안(Proposal) 문의 등, 아직 프로젝트에 프리랜서가 배정되지 않은 경우에도 사용합니다.
     */
    @Transactional
    public ChatRoom resolveOrCreateChatRoomForClientAndFreelancer(
            Project project,
            User clientUser,
            User freelancerUser
    ) {
        validateProjectClientAndPair(project, clientUser, freelancerUser);
        return resolveOrCreateChatRoom(project, clientUser, freelancerUser, null);
    }

    /**
     * {@link #resolveOrCreateChatRoomForClientAndFreelancer(Project, User, User)} 와 동일하되,
     * 호출자(actingUser) 기준 {@link ChatRoomResponse} 로 반환합니다.
     */
    @Transactional
    public ChatRoomResponse getOrCreateRoomForProjectClientAndFreelancer(
            User actingUser,
            Project project,
            User clientUser,
            User freelancerUser
    ) {
        validateProjectClientAndPair(project, clientUser, freelancerUser);
        AtomicBoolean createdNew = new AtomicBoolean(false);
        ChatRoom room = resolveOrCreateChatRoom(project, clientUser, freelancerUser, createdNew);
        if (createdNew.get()) {
            User recipient = actingUser.getId().equals(clientUser.getId()) ? freelancerUser : clientUser;
            notificationService.notifyUser(
                    recipient.getId(),
                    NotificationType.CHAT_ROOM_CREATED,
                    "새 문의 채팅방",
                    actingUser.getNickname() + " 님이 '" + project.getProjectName() + "' 문의 채팅방을 만들었습니다.",
                    room.getId()
            );
        }
        return ChatRoomResponse.from(room, actingUser);
    }

    private static void validateProjectClientAndPair(Project project, User clientUser, User freelancerUser) {
        if (project.getClientProfile() == null) {
            throw new ResourceNotFoundException("프로젝트에 클라이언트 정보가 없습니다.");
        }
        if (!project.getClientProfile().getUser().getId().equals(clientUser.getId())) {
            throw new ChatAccessDeniedException("해당 프로젝트의 클라이언트만 이 채팅방에 참여할 수 있습니다.");
        }
        if (clientUser.getId().equals(freelancerUser.getId())) {
            throw new IllegalArgumentException("동일한 사용자 간에는 채팅방을 만들 수 없습니다.");
        }
    }

    /**
     * 시스템 안내 메시지를 저장하고, 구독 중인 클라이언트에 웹소켓으로 전달합니다.
     *
     * @param technicalSender 감사 추적용 발신자(프론트에서는 {@code systemMessage}로 구분 표시)
     */
    @Transactional
    public ChatMessageResponse saveSystemMessageAndBroadcast(ChatRoom room, User technicalSender, String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("시스템 메시지 내용은 비어 있을 수 없습니다.");
        }

        ChatMessage message = chatMessageRepository.save(
                ChatMessage.builder()
                        .chatRoom(room)
                        .sender(technicalSender)
                        .content(content.trim())
                        .systemMessage(true)
                        .build()
        );

        ChatMessageResponse response = ChatMessageResponse.from(message);
        eventPublisher.publishEvent(new SystemMessageCreatedEvent(room.getId(), response));
        return response;
    }

    private ChatRoom resolveOrCreateChatRoom(
            Project project,
            User userA,
            User userB,
            AtomicBoolean createdFlag
    ) {
        User first = userA.getId() < userB.getId() ? userA : userB;
        User second = userA.getId() < userB.getId() ? userB : userA;

        ChatRoom room = chatRoomRepository.findByProjectAndUser1AndUser2(project, first, second)
                .orElse(null);

        if (room == null) {
            try {
                room = chatRoomRepository.saveAndFlush(
                        ChatRoom.builder()
                                .project(project)
                                .user1(first)
                                .user2(second)
                                .build()
                );
                if (createdFlag != null) {
                    createdFlag.set(true);
                }
            } catch (DataIntegrityViolationException e) {
                room = chatRoomRepository.findByProjectAndUser1AndUser2(project, first, second)
                        .orElseThrow(() -> e);
            }
        }
        return room;
    }

    // 내 채팅방 목록 조회
    public List<ChatRoomListResponse> getMyRooms(User me) {
        List<ChatRoom> rooms = chatRoomRepository.findAllByUser1OrUser2OrderByUpdatedAtDesc(me, me);

        if (rooms.isEmpty()) {
            return List.of();
        }

        // 채팅방 id 목록
        List<Long> roomIds = rooms.stream().map(ChatRoom::getId).toList();

        // Bulk 조회: 마지막 메시지들
        List<ChatMessage> lastMessages = chatMessageRepository.findLastMessagesForChatRooms(roomIds);
        // Map roomId -> ChatMessage
        java.util.Map<Long, ChatMessage> lastMessageMap = new java.util.HashMap<>();
        for (ChatMessage m : lastMessages) {
            if (m.getChatRoom() != null && m.getChatRoom().getId() != null) {
                lastMessageMap.put(m.getChatRoom().getId(), m);
            }
        }

        // Bulk 조회: 읽지 않은 개수
        List<Object[]> unreadCounts = chatMessageRepository.countUnreadByChatRoomIn(roomIds, me.getId());
        java.util.Map<Long, Long> unreadCountMap = new java.util.HashMap<>();
        for (Object[] row : unreadCounts) {
            Number roomIdNum = (Number) row[0];
            Number cntNum = (Number) row[1];
            unreadCountMap.put(roomIdNum.longValue(), cntNum.longValue());
        }

        return rooms.stream()
                .map(room -> {
                    ChatMessage lastMessage = lastMessageMap.get(room.getId());
                    long unreadCount = unreadCountMap.getOrDefault(room.getId(), 0L);

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
    public List<ChatMessageResponse> getMessages(User me, Long roomId, int page, int size) {
        ChatRoom room = getValidatedRoom(me, roomId);

        // 페이지 요청: 생성일 기준 오름차순 (오래된 메시지부터)
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size,
                org.springframework.data.domain.Sort.by("createdAt").ascending());

        org.springframework.data.domain.Page<ChatMessage> messages = chatMessageRepository.findByChatRoomOrderByCreatedAtAsc(room, pageable);

        return messages.getContent().stream()
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