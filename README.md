<div align="center">
  <a href="https://github.com/Ashwin-Pulipati/lovibe">
    <img src="public/logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Lovibe</h3>

  <p align="center">
    An intelligent, sandboxed environment for building, testing, and collaborating on code with the power of AI.
    <br />
    <a href="https://lovibe.vercel.app/"><strong>View Demo »</strong></a>
  </p>
</div>

## 📝 About The Project

Lovibe is a modern, full-stack application designed to provide a seamless and secure coding experience in the browser. It leverages secure, sandboxed environments to allow users to write, execute, and test code snippets or entire projects safely. With AI-powered code interpretation, user authentication, and a sleek, component-based UI, Lovibe is perfect for developers, students, and teams looking for a powerful and collaborative coding tool.



https://github.com/user-attachments/assets/801a56c8-bbec-4d4c-bca7-ee9d865bea6a



## ⚙️ Built With

This project is built with a modern tech stack that ensures scalability, type safety, and a great developer experience.

*   **Framework:** [Next.js](https://nextjs.org/)
*   **Backend & API:** [tRPC](https://trpc.io/)
*   **Database ORM:** [Prisma](https://www.prisma.io/)
*   **AI Integration:** [OpenAI API](https://platform.openai.com/)
*   **Authentication:** [Clerk](https://clerk.com/)
*   **Code Sandboxing:** [E2B Code Interpreter](https://e2b.dev/)
*   **Background Jobs:** [Inngest](https://www.inngest.com/)
*   **UI:** [Tailwind CSS](https://tailwindcss.com/) & [Shadcn/UI](https://ui.shadcn.com/)
*   **Deployment:** [Vercel](https://vercel.com/)

## 🏗️ System Architecture

Lovibe AI is built with a focus on type-safety, security, and reliable AI orchestration. The system is divided into four distinct layers:

### 1. Application Layer (Next.js & tRPC)
- **Frontend:** Built with React and Tailwind CSS, utilizing a component-based architecture for a highly responsive user experience.
- **API Communication:** Leverages tRPC to provide end-to-end type safety between the client and the server, eliminating runtime API errors and improving developer velocity.
- **Authentication:** Managed by Clerk, providing secure session management and tiered user access.

### 2. Orchestration & AI Layer (Inngest & GPT-4)
- **Event-Driven Workflows:** Uses Inngest to handle complex, multi-step background processes. This ensures that long-running AI generation tasks are resilient to timeouts and can be retried automatically if a step fails.
- **AI Agent:** Interfaces with OpenAI’s GPT-4 to interpret natural language prompts and transform them into functional, production-ready code.

### 3. Secure Runtime (E2B Sandboxing)
- **Code Execution:** Security is paramount when executing AI-generated code. Lovibe utilizes E2B (Docker-based sandboxes) to provide an isolated environment where code is written, installed, and executed without ever touching the host server.
- **Streaming:** Logs and outputs are streamed back to the user in real-time, providing immediate feedback on the app’s deployment status.

### 4. Data & Infrastructure (Prisma & PostgreSQL)
- **ORM:** Prisma is used for schema management and type-safe database queries.
- **Persistence:** A PostgreSQL database stores user profiles, credit balances, and historical project metadata.

## ✅ Key Features

- **Secure Code Execution:** Run untrusted code in fully isolated, sandboxed environments powered by E2B.
- **AI-Powered Assistance:** Integrated AI capabilities to help with code generation, debugging, and analysis.
- **Project Management:** Create, manage, and organize your coding projects.
- **User Authentication:** Secure sign-up and sign-in functionality with Clerk.
- **Interactive UI:** A rich, responsive interface with a file explorer, code editor, and results viewer.
- **Real-time Feedback:** Get instant feedback and results from your code executions.

## ▶️ Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have Node.js and npm installed on your machine.
* npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/Ashwin-Pulipati/lovibe.git
    cd lovibe
    ```
2.  **Install NPM packages:**
    ```sh
    npm install
    ```
3.  **Set up your environment variables:**
    Create a `.env.local` file in the root of your project and add the necessary environment variables. You will need keys for Clerk, Prisma (your database connection string), and E2B.
    ```env
    # Clerk
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
    CLERK_SECRET_KEY=

    # Database (Example for PostgreSQL)
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

    # E2B
    E2B_API_KEY=

    # OpenAI
    OPENAI_API_KEY =
    ```
4.  **Run database migrations:**
    ```sh
    npx prisma migrate dev
    ```
5.  **Run the development applications:**
    In three separate terminals, run the following commands to start the development server, Inngest, and Prisma Studio.
    ```sh
    npm run dev
    ```
    ```sh
    npx inngest-cli dev
    ```
    ```sh
    npx prisma studio
    ```
6.  Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## 🚀 Usage

Lovibe is designed to be intuitive. Here’s a typical user story:

A developer signs in with their Google account, creates a new Python project, and writes a script to analyze a dataset using Pandas. They execute the script and see a Matplotlib chart rendered directly in the output. The AI assistant helps them refine the code, and they can share their project with a colleague for feedback.

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

You can also report a bug or request a feature by opening an issue:
- [Report Bug](https://github.com/Ashwin-Pulipati/lovibe/issues)
- [Request Feature](https://github.com/Ashwin-Pulipati/lovibe/issues)


## 📄 License

Distributed under the MIT License. See the [LICENSE](LICENSE) file for more information.

## 📧 Contact

Ashwin Pulipati - [LinkedIn](https://www.linkedin.com/in/ashwinpulipati/) - ashwinpulipati@gmail.com

Project Link: [https://github.com/Ashwin-Pulipati/lovibe](https://github.com/Ashwin-Pulipati/lovibe)
