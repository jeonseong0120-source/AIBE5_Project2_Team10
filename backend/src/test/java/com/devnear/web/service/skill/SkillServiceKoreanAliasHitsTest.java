package com.devnear.web.service.skill;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashSet;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SkillServiceKoreanAliasHitsTest {

    @Test
    void javascriptWordDoesNotTriggerJavaFromEmbeddedJavaSubstring() {
        LinkedHashSet<String> hits = SkillService.collectKoreanAliasEnglishHits("자바스크립트");
        assertFalse(hits.contains("java"), "자바 inside 자바스크립트 must not register Java alias hit");
        assertTrue(hits.contains("javascript"), "whole-word 자바스크립트 maps to JavaScript");
    }

    @Test
    void standaloneJavaKoreanStillRegistersJava() {
        LinkedHashSet<String> hits = SkillService.collectKoreanAliasEnglishHits("백엔드 자바 스프링");
        assertTrue(hits.contains("java"));
    }
}
