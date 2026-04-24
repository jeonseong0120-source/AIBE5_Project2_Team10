package com.devnear.test.support;

import org.springframework.jdbc.datasource.DelegatingDataSource;

import java.sql.Connection;
import java.sql.SQLException;

/**
 * 실제 {@link javax.sql.DataSource} 위에 두어 커넥션에서 나가는 statement 실행을 {@link QueryCountHolder}에 남깁니다.
 */
public class QueryCountingDataSource extends DelegatingDataSource {

    public QueryCountingDataSource(javax.sql.DataSource targetDataSource) {
        super(targetDataSource);
    }

    @Override
    public Connection getConnection() throws SQLException {
        return QueryCountingConnections.wrap(super.getConnection());
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        return QueryCountingConnections.wrap(super.getConnection(username, password));
    }
}
