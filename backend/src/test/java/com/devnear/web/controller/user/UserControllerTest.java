package com.devnear.web.controller.user;

import com.devnear.web.service.user.AccountWithdrawalService;
import com.devnear.web.service.user.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private AccountWithdrawalService accountWithdrawalService;

    @InjectMocks
    private UserController userController;

    @Test
    void withdrawAccountReturnsNoContentAndDelegatesService() {
        UserDetails userDetails = org.mockito.Mockito.mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("withdraw-user@test.com");

        ResponseEntity<Void> response = userController.withdrawAccount(userDetails);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(accountWithdrawalService).withdrawByEmail("withdraw-user@test.com");
    }
}

