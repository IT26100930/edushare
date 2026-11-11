package com.edushare.modules.admin;

import com.edushare.shared.TextFileStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ModuleRequestStoreTest {

    @TempDir
    Path dir;

    private TextFileStore store;
    private ModuleRequestStore requests;

    @BeforeEach
    void setup() {
        store = new TextFileStore(dir.toString());
        requests = new ModuleRequestStore(store);
    }

    private ModuleRequest sample(long id, String name, String reason) {
        return new ModuleRequest(
            id, 2, "SE1010", name, "IT", reason,
            "PENDING", "", "2026-11-11T00:00:00Z", "", 0
        );
    }

    @Test
    void savesAndReadsRequest() {
        requests.save(sample(1, "Java Programming",
            "Need this module for studies."));

        List<ModuleRequest> result = requests.all();

        assertEquals(1, result.size());
        assertEquals("Java Programming", result.get(0).getName());
        assertEquals(2, result.get(0).getRequestedBy());
    }

    @Test
    void updatesExistingRequestInsteadOfDuplicating() {
        requests.save(sample(1, "Java Programming",
            "Initial reason for request."));
        requests.save(sample(1, "Advanced Java",
            "Updated reason for request."));

        List<ModuleRequest> result = requests.all();

        assertEquals(1, result.size());
        assertEquals("Advanced Java", result.get(0).getName());
    }

    @Test
    void generatesNextId() {
        requests.save(sample(1, "Java Programming",
            "Need this module for studies."));
        requests.save(sample(2, "Database Systems",
            "Need database knowledge."));

        assertEquals(3, requests.nextId());
    }

    @Test
    void ignoresMalformedNumericRecords() {
        store.write("module-requests.txt", List.of(
            "invalid|2|SE1010|Java|IT|Reason|PENDING||date||0"
        ));

        assertTrue(requests.all().isEmpty());
    }

    @Test
    void sanitizesPipeAndNewlineCharacters() {
        requests.save(sample(1, "Java|Programming",
            "First line\nSecond line"));

        ModuleRequest result = requests.all().get(0);

        assertEquals("Java/Programming", result.getName());
        assertEquals("First line Second line", result.getReason());
    }
}