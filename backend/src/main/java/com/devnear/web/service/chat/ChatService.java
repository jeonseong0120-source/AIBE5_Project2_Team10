package com.devnear.web.service.chat;

import com.devnear.web.domain.chat.ChatMessage;
import com.devnear.web.domain.chat.ChatMessageRepository;
import com.devnear.web.domain.chat.ChatRoom;
import com.devnear.web.domain.chat.ChatRoomRepository;
import com.devnear.web.domain.enums.NotificationType;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.domain.proposal.ProposalRepository;
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
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ProposalRepository proposalRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;
    private final NotificationService notificationService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public ChatRoomResponse createRoom(User me, ChatRoomCreateRequest request) {
        if (me.getId().equals(request.getTargetUserId())) {
            throw new IllegalArgumentException("자기 자신과는 채팅방을 만들 수 없습니다.");
        }

        User target = userRepository.findById(request.getTargetUserId())
                .orElseThrow(() -> new ResourceNotFoundException("대상 유저를 찾을 수 없습니다."));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("프로젝트를 찾을 수 없습니다."));

        if (project.getClientProfile() == null || project.getClientProfile().getUser() == null) {
            throw new ResourceNotFoundException("프로젝트의 클라이언트 정보를 찾을 수 없습니다.");
        }

        Long clientUserId = project.getClientProfile().getUser().getId();

        boolean meIsClient = me.getId().equals(clientUserId);
        boolean targetIsClient = target.getId().equals(clientUserId);

        if (!meIsClient && targetIsClient) {
            freelancerProfileRepository.findByUser_Id(me.getId())
                    .orElseThrow(() -> new ChatAccessDeniedException("프리랜서만 프로젝트 문의 채팅을 시작할 수 있습니다."));
            return createOrGetRoom(me, target, project);
        }

        if (meIsClient && !targetIsClient) {
            FreelancerProfile freelancerProfile = freelancerProfileRepository.findByUser_Id(target.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("프리랜서 프로필을 찾을 수 없습니다."));

            boolean hasProposal = proposalRepository.existsByProjectIdAndFreelancerProfileId(
                    project.getId(),
                    freelancerProfile.getId()
            );

            if (!hasProposal) {
                throw new ChatAccessDeniedException("역제안을 보낸 프리랜서와만 채팅할 수 있습니다.");
            }

            return createOrGetRoom(me, target, project);
        }

        throw new ChatAccessDeniedException("채팅방을 생성할 수 없습니다.");
    }

    @Transactional
    public ChatRoom resolveOrCreateChatRoomForClientAndFreelancer(
            Project project,
            User clientUser,
            User freelancerUser
    ) {
        validateProjectClientAndPair(project, clientUser, freelancerUser);
        return resolveOrCreateChatRoom(project, clientUser, freelancerUser, null, null);
    }

    @Transactional
    public ChatRoomResponse getOrCreateRoomForProjectClientAndFreelancer(
            User actingUser,
            Project project,
            User clientUser,
            User freelancerUser
    ) {
        validateProjectClientAndPair(project, clientUser, freelancerUser);

        AtomicBoolean createdNew = new AtomicBoolean(false);
        ChatRoom room = resolveOrCreateChatRoom(project, clientUser, freelancerUser, actingUser, createdNew);

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

    private ChatRoomResponse createOrGetRoom(User me, User target, Project project) {
        AtomicBoolean createdNew = new AtomicBoolean(false);
        ChatRoom room = resolveOrCreateChatRoom(project, me, target, me, createdNew);

        if (createdNew.get()) {
            notificationService.notifyUser(
                    target.getId(),
                    NotificationType.CHAT_ROOM_CREATED,
                    "채팅 시작",
                    me.getNickname() + " 님이 '" + project.getProjectName() + "' 채팅을 시작했습니다.",
                    room.getId()
            );
        }

        return ChatRoomResponse.from(room, me);
    }

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
            User initiator,
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
        } else {
            if (initiator != null) {
                room.restoreFor(initiator);
            }
        }

        return room;
    }

    public List<ChatRoomListResponse> getMyRooms(User me) {
        List<ChatRoom> rooms = chatRoomRepository.findAllByUser1OrUser2OrderByUpdatedAtDesc(me, me)
                .stream()
                .filter(room -> !room.isExited(me))
                .toList();

        if (rooms.isEmpty()) {
            return List.of();
        }

        Map<Long, ChatRoom> latestRoomByOpponentId = new LinkedHashMap<>();

        for (ChatRoom room : rooms) {
            Long opponentId = room.getOpponent(me).getId();

            latestRoomByOpponentId.compute(opponentId, (key, existingRoom) -> {
                if (existingRoom == null) {
                    return room;
                }

                if (room.getUpdatedAt() == null) {
                    return existingRoom;
                }

                if (existingRoom.getUpdatedAt() == null) {
                    return room;
                }

                return room.getUpdatedAt().isAfter(existingRoom.getUpdatedAt())
                        ? room
                        : existingRoom;
            });
        }

        List<ChatRoom> visibleRooms = latestRoomByOpponentId.values().stream().toList();

        List<Long> roomIds = visibleRooms.stream()
                .map(ChatRoom::getId)
                .toList();

        List<ChatMessage> lastMessages = chatMessageRepository.findLastMessagesForChatRooms(roomIds);
        Map<Long, ChatMessage> lastMessageMap = new HashMap<>();

        for (ChatMessage message : lastMessages) {
            if (message.getChatRoom() != null && message.getChatRoom().getId() != null) {
                lastMessageMap.put(message.getChatRoom().getId(), message);
            }
        }

        List<Object[]> unreadCounts = chatMessageRepository.countUnreadByChatRoomIn(roomIds, me.getId());
        Map<Long, Long> unreadCountMap = new HashMap<>();

        for (Object[] row : unreadCounts) {
            Number roomIdNum = (Number) row[0];
            Number countNum = (Number) row[1];
            unreadCountMap.put(roomIdNum.longValue(), countNum.longValue());
        }

        return visibleRooms.stream()
                .map(room -> {
                    ChatMessage lastMessage = lastMessageMap.get(room.getId());
                    long unreadCount = unreadCountMap.getOrDefault(room.getId(), 0L);
                    return ChatRoomListResponse.of(room, me, lastMessage, unreadCount);
                })
                .sorted(Comparator.comparing(
                        ChatRoomListResponse::getLastMessageAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .toList();
    }

    public List<ChatMessageResponse> getMessages(User me, Long roomId, int page, int size) {
        ChatRoom room = getValidatedRoom(me, roomId);

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("createdAt").descending()
        );

        Page<ChatMessage> messages = chatMessageRepository.findByChatRoomOrderByCreatedAtDesc(room, pageable);
        List<ChatMessage> orderedMessages = messages.getContent().stream()
                .sorted(Comparator.comparing(ChatMessage::getCreatedAt))
                .toList();

        return orderedMessages.stream()
                .map(ChatMessageResponse::from)
                .toList();
    }

    @Transactional
    public int markAsRead(User me, Long roomId) {
        ChatRoom room = getValidatedRoom(me, roomId);
        return chatMessageRepository.markAllAsRead(room, me);
    }

    @Transactional
    public void leaveRoom(User me, Long roomId) {
        ChatRoom room = getValidatedRoom(me, roomId);
        room.exit(me);
    }

    @Transactional
    public ChatMessageResponse saveMessage(User me, ChatMessageSendRequest request) {
        ChatRoom room = getValidatedRoom(me, request.getRoomId());

        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("메시지 내용은 비어 있을 수 없습니다.");
        }

        ChatMessage message = chatMessageRepository.save(
                ChatMessage.builder()
                        .chatRoom(room)
                        .sender(me)
                        .content(request.getContent().trim())
                        .build()
        );

        return ChatMessageResponse.from(message);
    }

    private ChatRoom getValidatedRoom(User me, Long roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("채팅방을 찾을 수 없습니다."));

        if (!room.isParticipant(me)) {
            throw new ChatAccessDeniedException("해당 채팅방에 접근할 권한이 없습니다.");
        }

        if (room.isExited(me)) {
            throw new ChatAccessDeniedException("나간 채팅방에는 접근할 수 없습니다.");
        }

        return room;
    }
}