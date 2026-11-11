package com.edushare.modules.resource;

import java.io.*;
import java.nio.file.Path;
import org.apache.pdfbox.io.MemoryUsageSetting;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Read a bounded page range without retaining an unbounded extracted text string. */
public final class PdfStudyText {
  public static final long MAX_UPLOAD_BYTES = 100L * 1024 * 1024;

  private PdfStudyText() {}

  public static final class Excerpt {
    public final String text, coverage;
    public final int totalPages, startPage, endPage;
    public final boolean limited;

    Excerpt(String text, int total, int start, int end, boolean clipped) {
      this.text = text;
      totalPages = total;
      startPage = start;
      endPage = end;
      limited = clipped || start > 1 || end < total;
      coverage =
          "Pages "
              + start
              + "–"
              + end
              + " of "
              + total
              + "; "
              + text.length()
              + " characters sent"
              + (clipped ? " (text limit reached)" : "")
              + (limited ? ". Partial document coverage." : ". Full document text range.");
    }
  }

  private static final class TextBuffer extends Writer {
    final StringBuilder value = new StringBuilder();
    final int limit;
    boolean clipped;

    TextBuffer(int limit) {
      this.limit = limit;
    }

    @Override
    public void write(char[] text, int offset, int length) {
      int available = Math.max(0, limit - value.length()), take = Math.min(available, length);
      value.append(text, offset, take);
      if (take < length) clipped = true;
    }

    @Override
    public void flush() {}

    @Override
    public void close() {}
  }

  public static Excerpt extract(
      Path file, int start, Integer requestedEnd, int maxPages, int maxCharacters)
      throws IOException {
    try (PDDocument document =
        PDDocument.load(file.toFile(), MemoryUsageSetting.setupMixed(16L * 1024 * 1024))) {
      if (document.isEncrypted())
        throw new ResponseStatusException(
            HttpStatus.UNPROCESSABLE_ENTITY, "Password-protected PDFs cannot be processed.");
      int total = document.getNumberOfPages();
      if (start < 1 || start > total)
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "Start page must be within this PDF.");
      int end = requestedEnd == null ? Math.min(total, start + maxPages - 1) : requestedEnd;
      if (end < start || end > total || (long) end - start + 1 > maxPages)
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "Choose a valid page range of at most " + maxPages + " pages.");
      PDFTextStripper stripper = new PDFTextStripper();
      stripper.setStartPage(start);
      stripper.setEndPage(end);
      stripper.setSortByPosition(true);
      TextBuffer buffer = new TextBuffer(maxCharacters);
      stripper.writeText(document, buffer);
      String text = buffer.value.toString().trim();
      if (text.isBlank())
        throw new ResponseStatusException(
            HttpStatus.UNPROCESSABLE_ENTITY,
            "No selectable text was found in this range. Scanned/image-only PDFs need OCR before"
                + " using these study tools.");
      return new Excerpt(text, total, start, end, buffer.clipped);
    }
  }
}
