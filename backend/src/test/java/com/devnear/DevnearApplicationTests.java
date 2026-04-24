package com.devnear;

import com.devnear.test.config.QueryCountingTestConfiguration;
import com.devnear.test.support.QueryCountExtension;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@SpringBootTest
@Import(QueryCountingTestConfiguration.class)
@ExtendWith(QueryCountExtension.class)
class DevnearApplicationTests {
	@Test
	void contextLoads() {
	}
}