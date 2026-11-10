package com.edushare.modules.resource;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ResourceService {

    private final ResourceFileRepository repo;

    public ResourceService(ResourceFileRepository repo) {
        this.repo = repo;
    }

    public List<Resource> all(String category, String type, String module) {
        return all(category, type, module, null);
    }

    public List<Resource> all(String category, String type, String module, String uploader) {
        List<Resource> results = new ArrayList<>();
        for (Resource item : repo.findAll()) {
            if (!(category == null
                    || category.isBlank()
                    || item.getCategory().equalsIgnoreCase(category))) {
                continue;
            }
            if (!(type == null
                    || type.isBlank()
                    || item.getResourceType().equalsIgnoreCase(type))) {
                continue;
            }
            if (!(module == null
                    || module.isBlank()
                    || item.getModuleCode().equalsIgnoreCase(module))) {
                continue;
            }
            if (!(uploader == null
                    || uploader.isBlank()
                    || item.getUploaderEmail().equalsIgnoreCase(uploader))) {
                continue;
            }
            results.add(item);
        }
        return Collections.unmodifiableList(results);
    }

    public Optional<Resource> byId(long id) {
        return repo.findById(id);
    }

    public Resource create(Resource r) {
        return repo.save(r);
    }

    public Optional<Resource> update(long id, Resource in) {
        {
            Optional<Resource> foundRecord = repo.findById(id);
            if (foundRecord.isEmpty()) {
                return Optional.empty();
            }
            Resource r = foundRecord.get();
            if (in.getTitle() != null) {
                r.setTitle(in.getTitle());
            }
            if (in.getModuleCode() != null) {
                r.setModuleCode(in.getModuleCode());
            }
            if (in.getCategory() != null) {
                r.setCategory(in.getCategory());
            }
            r.setPriceType(in.getPriceType());
            r.setPrice(in.getPrice());
            if (in.getDescription() != null) {
                r.setDescription(in.getDescription());
            }
            if (in.getAcademicYear() != null) {
                r.setAcademicYear(in.getAcademicYear());
            }
            if (in.getSemester() != null) {
                r.setSemester(in.getSemester());
            }
            if (in.getTags() != null) {
                r.setTags(in.getTags());
            }
            return Optional.of(repo.save(r));
        }
    }

    public boolean delete(long id) {
        return repo.delete(id);
    }

    public Optional<Resource> setStatus(long id, String status) {
        {
            Optional<Resource> foundRecord = repo.findById(id);
            if (foundRecord.isEmpty()) {
                return Optional.empty();
            }
            Resource r = foundRecord.get();
            r.setStatus(status);
            return Optional.of(repo.save(r));
        }
    }
}
