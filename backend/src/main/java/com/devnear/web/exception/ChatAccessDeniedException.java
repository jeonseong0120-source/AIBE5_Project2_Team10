package com.devnear.web.exception;

// 채팅방 참여자가 아닌 사람이 접근했을 때 사용하는 예외
public class ChatAccessDeniedException extends RuntimeException {
    public ChatAccessDeniedException(String message) {
        super(message);
    }
}