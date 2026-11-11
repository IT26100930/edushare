package com.edushare.modules.resource;

import com.edushare.modules.download.LinkFileRepository;
import com.edushare.modules.user.UserService;

import org.springframework.stereotype.Service;

/** Positive IDs identify documents; negative IDs identify external links. */
@Service
public class DiscussionAccess {

    private final ResourceService resources;

    private final LinkFileRepository links;

    private final UserService users;

    public DiscussionAccess(
            ResourceService resources, LinkFileRepository links, UserService users) {
        this.resources = resources;
        this.links = links;
        this.users = users;
    }

    public boolean allowed(long resourceId, long viewerId) {
        java.util.Optional<com.edushare.modules.user.User> user =
                users.byId(viewerId).filter(u -> !u.isSuspended());
        if (user.isEmpty() || resourceId == 0 || resourceId == Long.MIN_VALUE) {
            return false;
        }
        boolean admin = "ADMIN".equals(user.get().getRole());
        if (resourceId < 0) {
            return links.findByIdIncludingHidden(-resourceId)
                    .map(
                            link ->
                                    admin
                                            || user.get()
                                                    .getEmail()
                                                    .equalsIgnoreCase(link.getUploaderEmail())
                                            || ("APPROVED".equals(link.getStatus())
                                                    && !links.isHidden(link.getId())))
                    .orElse(false);
        }
        return resources
                .byId(resourceId)
                .map(
                        resource ->
                                admin
                                        || user.get()
                                                .getEmail()
                                                .equalsIgnoreCase(resource.getUploaderEmail())
                                        || "APPROVED".equalsIgnoreCase(resource.getStatus()))
                .orElse(false);
    }
}
