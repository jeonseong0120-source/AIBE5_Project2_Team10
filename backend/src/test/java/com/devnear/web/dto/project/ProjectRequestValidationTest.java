package com.devnear.web.dto.project;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.LongStream;

import static org.assertj.core.api.Assertions.assertThat;

class ProjectRequestValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        factory.close();
    }

    @Test
    void skillIds_atMost10_valid() {
        ProjectRequest req = minimalValidRequest();
        List<Long> ids = LongStream.rangeClosed(1, 10).boxed().toList();
        req.setSkillIds(ids);

        assertThat(validator.validate(req)).isEmpty();
    }

    @Test
    void skillIds_moreThan10_invalid() {
        ProjectRequest req = minimalValidRequest();
        List<Long> ids = LongStream.rangeClosed(1, 11).boxed().toList();
        req.setSkillIds(ids);

        Set<ConstraintViolation<ProjectRequest>> violations = validator.validate(req);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("skillIds"));
    }

    @Test
    void skillNames_moreThan10_invalid() {
        ProjectRequest req = minimalValidRequest();
        List<String> names = new ArrayList<>();
        for (int i = 0; i < 11; i++) {
            names.add("s" + i);
        }
        req.setSkillNames(names);

        Set<ConstraintViolation<ProjectRequest>> violations = validator.validate(req);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("skillNames"));
    }

    private static ProjectRequest minimalValidRequest() {
        ProjectRequest req = new ProjectRequest();
        req.setProjectName("테스트 공고");
        req.setBudget(100_000);
        req.setDeadline(LocalDate.now().plusDays(7));
        req.setOnline(true);
        req.setOffline(false);
        return req;
    }
}
