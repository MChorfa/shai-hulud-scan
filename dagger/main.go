package main

import (
	"context"

	d "dagger/shai-hulud-check/internal/dagger"
)

type ShaiHuludCheck struct{}

// BuildDB builds the SQLite database from the source CSV.
func (m *ShaiHuludCheck) BuildDB(ctx context.Context, source *d.Directory) (*d.File, error) {
	ctr := dag.Container().
		From("node:22-bookworm").
		WithDirectory("/app", source).
		WithWorkdir("/app").
		WithExec([]string{"npm", "ci"}).
		WithExec([]string{"npm", "run", "build-db"})

	return ctr.File("data/shai-hulud.db"), nil
}

// BuildSite builds the Next.js static site (and the DB as a prerequisite).
// It also creates a .nojekyll file for GitHub Pages deployment.
func (m *ShaiHuludCheck) BuildSite(ctx context.Context, source *d.Directory) (*d.Directory, error) {
	ctr := dag.Container().
		From("node:22-bookworm").
		WithDirectory("/app", source).
		WithWorkdir("/app").
		WithExec([]string{"npm", "ci"}).
		WithExec([]string{"npm", "run", "build-db"}). // Ensure DB is built
		WithExec([]string{"npm", "run", "export"}).
		WithExec([]string{"touch", "out/.nojekyll"})

	return ctr.Directory("out"), nil
}

// Check builds the database from the source and checks the package-lock.json for infections.
// It ensures the check is always performed against the latest data in the source.
func (m *ShaiHuludCheck) Check(ctx context.Context, source *d.Directory) (string, error) {
	// 1. Setup Node.js environment (same as Build)
	ctr := dag.Container().
		From("node:22-bookworm").
		WithDirectory("/app", source).
		WithWorkdir("/app").
		WithExec([]string{"npm", "ci"})

	// 2. Build Database (to ensure we have the latest embeddings/data)
	ctr = ctr.WithExec([]string{"npm", "run", "build-db"})

	// 3. Run the Check Script
	// We use the check-sqlite.ts script which queries the just-built DB
	// We pass package-lock.json explicitly, assuming it's in the root of source
	ctr = ctr.WithExec([]string{"npx", "tsx", "scripts/check-sqlite.ts", "package-lock.json"})

	// 4. Capture output
	stdout, err := ctr.Stdout(ctx)
	if err != nil {
		return "", err
	}

	return stdout, nil
}

// Test runs the project's test suite (linting and unit tests).
func (m *ShaiHuludCheck) Test(ctx context.Context, source *d.Directory) (string, error) {
	out, err := dag.Container().
		From("node:22-bookworm-slim").
		WithDirectory("/app", source).
		WithWorkdir("/app").
		WithExec([]string{"npm", "ci"}).
		WithExec([]string{"npm", "run", "lint"}).
		WithExec([]string{"npm", "test"}).
		Stdout(ctx)

	if err != nil {
		return "", err
	}

	_ = out
	return "✅ Tests passed (linting + unit tests)", nil
}

// Scan is an alias for Check, specifically for scanning the repository itself.
func (m *ShaiHuludCheck) Scan(ctx context.Context, source *d.Directory) (string, error) {
	return m.Check(ctx, source)
}

// Deploy runs the CI/CD pipeline: build site and DB.
// This matches the original GitHub Actions deploy job behavior.
// Test and Scan are available as separate functions for PR checks.
func (m *ShaiHuludCheck) Deploy(ctx context.Context, source *d.Directory) (*d.Directory, error) {
	ctr := dag.Container().
		From("node:22-bookworm").
		WithDirectory("/app", source).
		WithWorkdir("/app").
		WithExec([]string{"npm", "ci"}).
		WithExec([]string{"npm", "run", "build-db"}).
		WithExec([]string{"npm", "run", "export"}).
		WithExec([]string{"touch", "out/.nojekyll"})

	return ctr.Directory("out"), nil
}
