package com.edushare.modules.user;

import com.edushare.modules.download.Link;
import com.edushare.modules.resource.Resource;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.core.MethodParameter;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.http.server.*;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import java.util.*;

/** Redact contact details at the JSON boundary, without changing stored ownership. */
@RestControllerAdvice
public class ResourceEmailVisibilityAdvice implements ResponseBodyAdvice<Object> {

    private final UserService users;

    private final ObjectMapper mapper;

    public ResourceEmailVisibilityAdvice(UserService users, ObjectMapper mapper) {
        this.users = users;
        this.mapper = mapper;
    }

    public boolean supports(
            MethodParameter method, Class<? extends HttpMessageConverter<?>> converter) {
        return MappingJackson2HttpMessageConverter.class.isAssignableFrom(converter);
    }

    public Object beforeBodyWrite(
            Object body,
            MethodParameter method,
            MediaType type,
            Class<? extends HttpMessageConverter<?>> converter,
            ServerHttpRequest request,
            ServerHttpResponse response) {
        if (!(request instanceof ServletServerHttpRequest)) {
            return body;
        }
        ServletServerHttpRequest servlet = (ServletServerHttpRequest) request;
        jakarta.servlet.http.HttpSession session = servlet.getServletRequest().getSession(false);
        User viewer = null;
        try {
            if (session != null && session.getAttribute("userId") != null) {
                viewer =
                        users.byId(Long.parseLong(session.getAttribute("userId").toString()))
                                .filter(u -> !u.isSuspended())
                                .orElse(null);
            }
        } catch (NumberFormatException ignored) {
        }
        // Member-specific JSON must not be reused by another signed-in account.
        response.getHeaders().setCacheControl("private, no-store");
        return redact(body, viewer, users.all());
    }

    private Object redact(Object body, User viewer, List<User> accounts) {
        String email = null;
        if (body instanceof Resource) {
            Resource resource = (Resource) body;
            email = resource.getUploaderEmail();
        } else if (body instanceof Link) {
            Link link = (Link) body;
            email = link.getUploaderEmail();
        }
        if (body instanceof Resource || body instanceof Link) {
            Map<String, Object> out =
                    mapper.convertValue(
                            body, new TypeReference<LinkedHashMap<String, Object>>() {});
            User owner = null;
            for (User account : accounts) {
                if (account.getEmail() != null
                        && account.getEmail().equalsIgnoreCase(Objects.toString(email, ""))) {
                    owner = account;
                    break;
                }
            }
            out.put("uploaderId", owner == null ? null : owner.getId());
            boolean allowed =
                    viewer != null
                            && ("ADMIN".equals(viewer.getRole())
                                    || owner != null
                                            && (owner.getId() == viewer.getId()
                                                    || (owner.publicProfileEnabled()
                                                            && owner.emailVisibleToMembers())));
            if (!allowed) {
                out.put("uploaderEmail", "");
            }
            return out;
        }
        if (body instanceof List<?>) {
            List<?> list = (List<?>) body;
            List<Object> result = new ArrayList<>();
            for (Object item : list) {
                result.add(redact(item, viewer, accounts));
            }
            return Collections.unmodifiableList(result);
        }
        if (body instanceof Map<?, ?>) {
            Map<?, ?> map = (Map<?, ?>) body;
            Map<Object, Object> out = new LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                out.put(entry.getKey(), redact(entry.getValue(), viewer, accounts));
            }
            return out;
        }
        return body;
    }
}
