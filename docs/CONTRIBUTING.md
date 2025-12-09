# Contributing to LightLearn

Thank you for your interest in contributing to LightLearn! We welcome contributions from everyone.

## Code of Conduct

Please be respectful and considerate of others when contributing to this project.

## How to Contribute

1.  **Fork the Repository**: Click the "Fork" button on the top right of the repository page.
2.  **Clone your Fork**:
    ```bash
    git clone https://github.com/YOUR_USERNAME/light_learn.git
    cd light_learn
    ```
3.  **Create a Branch**: Create a new branch for your feature or bug fix.
    ```bash
    git checkout -b feature/my-new-feature
    ```
4.  **Make Changes**: Write your code and ensure it follows the project's coding style.
5.  **Commit Changes**:
    ```bash
    git commit -m "Add some feature"
    ```
6.  **Push to Branch**:
    ```bash
    git push origin feature/my-new-feature
    ```
7.  **Open a Pull Request**: Go to the original repository and open a pull request with a description of your changes.

## Development Standards

### Modular Architecture

Please follow the **Feature-Based Modular Architecture** described in [ARCHITECTURE.md](./ARCHITECTURE.md).

- **Backend**: Create new features in `server/features/` with Service-Controller-Routes pattern.
- **Frontend**: Create new features in `client/src/features/` with Services-Components-Pages pattern.

### Code Style

- Use **ESLint** and **Prettier** for code formatting.
- Write clear, descriptive variable and function names.
- Comment complex logic where necessary.

### Commit Messages

Use conventional commit messages:
- `feat: ...` for new features
- `fix: ...` for bug fixes
- `docs: ...` for documentation updates
- `refactor: ...` for code refactoring
- `style: ...` for formatting changes

## Reporting Issues

If you find a bug or have a feature request, please open an issue in the GitHub repository. Provide as much detail as possible.

---

Happy Coding! 🚀
