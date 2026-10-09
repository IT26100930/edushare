# EduShare
## E-Resource Sharing Platform

**Share. Learn. Unlock More.**

EduShare is an **SE1020 Object Oriented Programming project**. It is a modern educational
resource-sharing platform where students can discover, share, review, bookmark, watch, read
and download academic resources.

## Features

- Free membership and Premium membership (Rs. 499 / month, Rs. 4,999 / year)
- Educational resource sharing (e-books, lecture notes, past papers)
- Resource search and filters, categories
- Downloads (watermarked) and My Library
- Bookmarks and reviews (public and verified-download reviews)
- Resource requests
- Watch & Read (video and article links)
- Premium resource access with watermarked previews (`EDUSHARE • NAME • MEMBERSHIP`)
- Subscription management and demo checkout (no real payment)
- Admin dashboard (users, resources, subscriptions)
- Neo-brutalist UI with dark mode

## Tech stack

Java 17+, Spring Boot 3.2, Thymeleaf, Maven. Data is stored in plain pipe-delimited text
files inside the `data/` folder (no database needed).

## Run in IntelliJ IDEA

1. **File > Open** and choose the `EduShare` folder (the one containing `pom.xml`). Choose *Open as Project* and let Maven import.
2. Set **File > Project Structure > Project SDK** to JDK 17 or newer.
3. Open `src/main/java/com/example/edushare/EduShareApplication.java` and click the green run arrow next to `main`.
4. Open <http://localhost:8080>.

The working directory must be the project root so the app can find `data/`. IntelliJ does this by default.

## Run from the command line

```bash
mvn spring-boot:run
```

## Demo accounts

| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Free    | charith@edushare.com   | charith123  |
| Premium | premium@edushare.com   | premium123  |
| Admin   | admin@edushare.com     | admin123    |

## OOP concepts used

- **Abstraction and inheritance:** `User` -> `Student`, `Admin`; `Resource` -> `EBook`, `LectureNote`, `PastPaper`; `Review` -> `PublicReview`, `VerifiedReview`; `LearningLink` -> `VideoLink`, `ArticleLink`.
- **Polymorphism:** repositories and services handle the abstract types; each subclass supplies its own type, label and extra fields.
- **Encapsulation:** private fields with getters/setters in every model class.
- **Layered design:** model, repository (file storage), service (business rules), controller (web), dto, util.

## Project structure

```
com.example.edushare
├── EduShareApplication.java
├── model        (18 classes)
├── repository   (file-based, 9 classes)
├── service      (10 classes)
├── controller   (11 classes)
├── dto          (3 classes)
└── util         (FileUtil, ColorUtil)
```

## Data file formats

Every line is one record, fields separated by `|`. Lines starting with `#` are comments.
Special characters inside a field are escaped by `FileUtil` (`\p` for `|`, `\n` for a new line).
To reset the sample data, restore the files in `data/` from the original download.
