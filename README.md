\# EduShare

\### E-Resource Sharing System



\*\*SE1020 Object-Oriented Programming | Year 1, Semester 2\*\*



EduShare is an educational resource-sharing web application developed as a six-member group project. The platform allows users to share and discover learning resources, manage their profiles, request materials, and participate in learning communities.



\## Technologies Used



| Component | Technology |

|---|---|

| Frontend | React, TypeScript, Vite |

| Backend | Java 17, Spring Boot |

| Data Storage | Java File Handling (TXT Files) |

| Version Control | Git and GitHub |

| Development Tools | IntelliJ IDEA, VS Code |



This academic project uses Java File Handling instead of MySQL.



\## Team Members and Modules



| Member | Responsibility | GitHub Branch |

|---|---|---|

| Monal | User Management and Integration | `final/user-management` |

| Sandunika | Admin and Category Management | `final/admin-category` |

| Nimesh | Resource Management | `final/resource-management` |

| Lakshitha | Request Management | `final/request-management` |

| Charith | Download and Link Management | `final/download-link` |

| Sanjula | Review and Community Management | `final/review-management` |



Each member is responsible for their assigned module, including its Java implementation, relevant frontend components, testing, and Git contributions.



\## Main Features



\- User registration, login, and profile management

\- Student and administrator roles

\- Educational resource sharing and searching

\- Resource upload, preview, and download

\- Resource requests

\- Bookmarks and educational links

\- Reviews and community discussions

\- Notifications and user interactions



\*\*Project Status:\*\* The application is being integrated module by module. Features must be verified after all required modules are merged.



\## Object-Oriented Programming Concepts



The Java backend demonstrates:



\- Classes and Objects

\- Encapsulation

\- Inheritance

\- Abstraction

\- Polymorphism

\- Aggregation and relationships

\- Collections

\- Exception Handling

\- CRUD Operations

\- File Handling



\## Project Structure



```text

EduShare/

|-- public/

|-- src/

|   |-- components/

|   |-- context/

|   |-- pages/

|   |-- services/

|   |-- main/

|   |   |-- java/com/edushare/

|   |   |   |-- modules/

|   |   |   |-- shared/

|   |   |-- resources/

|   |-- test/

|-- pom.xml

|-- package.json

|-- README.md

```



\## Data Storage



EduShare uses Java File Handling to store application data in TXT files.



Configuration:



`src/main/resources/application.properties`



```properties

edushare.data-dir=${EDUSHARE\_DATA\_DIR:data}

server.port=8080

```



The application uses a `data/` directory by default. The shared `TextFileStore` creates the configured directory when initialized.



Actual user records and runtime data are excluded from GitHub through `.gitignore`.



\*\*Do not upload private user records, passwords, API keys, or runtime TXT files to GitHub.\*\*



\## Requirements



\- JDK 17

\- Node.js and npm

\- Git

\- IntelliJ IDEA



\## How to Run



\### 1. Clone the repository



```powershell

git clone https://github.com/IT26100930/edushare.git

cd edushare

```



\### 2. Checkout the final project branch



```powershell

git fetch origin

git switch final-main

git pull --ff-only origin final-main

```



\### 3. Install frontend dependencies



```powershell

npm ci

```



\### 4. Build the frontend



```powershell

npm run build

```



\### 5. Run Spring Boot



Open the project using IntelliJ IDEA and configure \*\*JDK 17\*\*.



Run `EduShareApplication.java` after all required backend modules are integrated.



Default application URL:



`http://localhost:8080`



\*\*Note:\*\* The current repository is being assembled progressively. The complete application may not build or run until all team modules are integrated.



\## GitHub Contribution Workflow



Each member works on their own branch.



1\. Clone the repository.

2\. Fetch the latest changes from GitHub.

3\. Switch to the assigned `final/\*` branch.

4\. Add or update only the files assigned to that member.

5\. Review changes before staging.

6\. Commit using a meaningful message.

7\. Push to GitHub using the member's own account.

8\. Create a Pull Request targeting `final-main`.

9\. Review and merge the Pull Request.

10\. Test the integrated application.



Example commands:



```powershell

git fetch origin

git switch final/resource-management

git status

git add -- path/to/your/file

git diff --cached --check

git commit -m "Implement resource management module"

git push -u origin final/resource-management

```



If the branch only exists on GitHub, create a local tracking branch before making changes.



\## Team Integration Rules



\- Do not commit directly to `final-main`.

\- Do not overwrite another member's module.

\- Preserve the existing user interface and animations.

\- Use Java File Handling for the academic project.

\- Coordinate changes to shared files.

\- Do not commit private data or credentials.

\- Review each Pull Request before merging.

\- Preserve individual contributions in Git history.



\## Academic Purpose



EduShare is developed for the SE1020 Object-Oriented Programming group project.



The project focuses on applying Java OOP concepts, file handling, collaboration, and software integration.
