BookmarkFileRepositorypackage com.example.edushare.repository;

import com.example.edushare.model.ResourceRequest;
import com.example.edushare.util.FileUtil;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class RequestFileRepository {

    private static final String FILE = "requests.txt";

    public synchronized List<ResourceRequest> findAll() {
        List<ResourceRequest> list = new ArrayList<>();
        for (String line : FileUtil.readLines(FILE)) {
            try {
                list.add(ResourceRequest.fromFields(FileUtil.split(line)));
            } catch (RuntimeException ignored) {
                // skip malformed line
            }
        }
        return list;
    }

    public ResourceRequest findById(String id) {
        return findAll().stream().filter(r -> r.getId().equals(id)).findFirst().orElse(null);
    }

    public synchronized void save(ResourceRequest request) {
        List<ResourceRequest> all = findAll();
        boolean replaced = false;
        for (int i = 0; i < all.size(); i++) {
            if (all.get(i).getId().equals(request.getId())) {
                all.set(i, request);
                replaced = true;
            }
        }
        if (!replaced) {
            all.add(request);
        }
        FileUtil.writeLines(FILE, all.stream().map(ResourceRequest::toLine).toList());
    }

    public synchronized void delete(String id) {
        List<ResourceRequest> all = findAll();
        all.removeIf(r -> r.getId().equals(id));
        FileUtil.writeLines(FILE, all.stream().map(ResourceRequest::toLine).toList());
    }
}
