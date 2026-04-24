package com.devnear.test.support;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.Statement;

/**
 * {@link Connection} / {@link PreparedStatement} / {@link Statement} 프록시로
 * execute 계열 호출마다 {@link QueryCountHolder}에 기록합니다.
 */
public final class QueryCountingConnections {

    private QueryCountingConnections() {
    }

    public static Connection wrap(Connection delegate) {
        return (Connection) Proxy.newProxyInstance(
                Connection.class.getClassLoader(),
                new Class<?>[]{Connection.class},
                new ConnectionHandler(delegate));
    }

    private static final class ConnectionHandler implements InvocationHandler {
        private final Connection delegate;

        ConnectionHandler(Connection delegate) {
            this.delegate = delegate;
        }

        @Override
        public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
            String name = method.getName();
            if ("prepareStatement".equals(name) && args != null && args.length > 0 && args[0] instanceof String sql) {
                PreparedStatement ps = (PreparedStatement) method.invoke(delegate, args);
                return wrapPreparedStatement(ps, sql);
            }
            if ("createStatement".equals(name)) {
                Statement st = (Statement) method.invoke(delegate, args);
                return wrapStatement(st);
            }
            return method.invoke(delegate, args);
        }
    }

    private static PreparedStatement wrapPreparedStatement(PreparedStatement ps, String sql) {
        return (PreparedStatement) Proxy.newProxyInstance(
                PreparedStatement.class.getClassLoader(),
                new Class<?>[]{PreparedStatement.class},
                (proxy, method, args) -> {
                    if (isSqlExecution(method.getName(), args)) {
                        QueryCountHolder.recordStatementExecution(sql);
                    }
                    return method.invoke(ps, args);
                });
    }

    private static Statement wrapStatement(Statement st) {
        return (Statement) Proxy.newProxyInstance(
                Statement.class.getClassLoader(),
                new Class<?>[]{Statement.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("executeQuery".equals(name) && args != null && args[0] instanceof String sql) {
                        QueryCountHolder.recordStatementExecution(sql);
                    } else if (("executeUpdate".equals(name) || "execute".equals(name) || "executeLargeUpdate".equals(name))
                            && args != null && args.length > 0 && args[0] instanceof String sql) {
                        QueryCountHolder.recordStatementExecution(sql);
                    }
                    return method.invoke(st, args);
                });
    }

    private static boolean isSqlExecution(String name, Object[] args) {
        if ("executeQuery".equals(name)) {
            return true;
        }
        if ("executeUpdate".equals(name) || "executeLargeUpdate".equals(name)) {
            return true;
        }
        if ("executeBatch".equals(name)) {
            return true;
        }
        // PreparedStatement.execute() 무인자
        return "execute".equals(name) && (args == null || args.length == 0);
    }
}
