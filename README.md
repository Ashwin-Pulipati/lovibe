<div align="center">
  <a href="https://github.com/your-github-username/lovibe">
    <img src="public/logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Lovibe</h3>

  <p align="center">
    An intelligent, sandboxed environment for building, testing, and collaborating on code with the power of AI.
</div>

## About The Project

Lovibe is a modern, full-stack application designed to provide a seamless and secure coding experience in the browser. It leverages secure, sandboxed environments to allow users to write, execute, and test code snippets or entire projects safely. With AI-powered code interpretation, user authentication, and a sleek, component-based UI, Lovibe is perfect for developers, students, and teams looking for a powerful and collaborative coding tool.

### Built With

This project is built with a modern tech stack that ensures scalability, type safety, and a great developer experience.

*   **Framework:** [Next.js](https://nextjs.org/)
*   **Backend & API:** [tRPC](https://trpc.io/)
*   **Database ORM:** [Prisma](https://www.prisma.io/)
*   **Authentication:** [Clerk](https://clerk.com/)
*   **Code Sandboxing:** [E2B Code Interpreter](https://e2b.dev/)
*   **Background Jobs:** [Inngest](https://www.inngest.com/)
*   **UI:** [Tailwind CSS](https://tailwindcss.com/) & [Shadcn/UI](https://ui.shadcn.com/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Deployment:** [Vercel](https://vercel.com/)

## Key Features

- **Secure Code Execution:** Run untrusted code in fully isolated, sandboxed environments powered by E2B.
- **AI-Powered Assistance:** Integrated AI capabilities to help with code generation, debugging, and analysis.
- **Project Management:** Create, manage, and organize your coding projects.
- **User Authentication:** Secure sign-up and sign-in functionality with Clerk.
- **Interactive UI:** A rich, responsive interface with a file explorer, code editor, and results viewer.
- **Real-time Feedback:** Get instant feedback and results from your code executions.

## Getting Started

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
    git clone https://github.com/your-github-username/lovibe.git
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
    ```
4.  **Run database migrations:**
    ```sh
    npx prisma migrate dev
    ```
5.  **Run the development server:**
    ```sh
    npm run dev
    ```
6.  Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Usage

Once the application is running, you can:
- Sign up for a new account or log in.
- Create a new project from your dashboard.
- Write and edit code in the provided editor.
- Run your code and see the output in the terminal view.
- Explore project files using the integrated file explorer.

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

## Contact

Ashwin Pulipati - [LinkedIn](https://www.linkedin.com/in/ashwinpulipati/) - ashwinpulipati@gmail.com

Project Link: [https://github.com/Ashwin-Pulipati/lovibe](https://github.com/Ashwin-Pulipati/lovibe)