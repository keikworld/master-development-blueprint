#!/usr/bin/env node

// create-blueprint-app — Scaffold a project from the Master Development Blueprint
// Usage: npx create-blueprint-app my-project
//        npx create-blueprint-app (interactive prompt for project name)

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createInterface } from 'node:readline'

const BLUEPRINT_REPO = 'https://github.com/keikworld/master-development-blueprint.git'

async function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => rl.question(question, answer => {
    rl.close()
    resolve(answer.trim())
  }))
}

async function main() {
  const args = process.argv.slice(2)
  let projectName = args.find(a => !a.startsWith('-'))

  if (!projectName) {
    projectName = await ask('Project name: ')
    if (!projectName) {
      console.error('Project name required')
      process.exit(1)
    }
  }

  const targetDir = resolve(process.cwd(), projectName)
  if (existsSync(targetDir)) {
    console.error(`Directory "${projectName}" already exists`)
    process.exit(1)
  }

  console.log(`\n  Creating "${projectName}" from the Master Development Blueprint...\n`)

  // Step 1: Clone blueprint (shallow, no history)
  const tmpDir = join(targetDir, '..', `.blueprint-tmp-${Date.now()}`)
  try {
    execSync(`git clone --depth 1 ${BLUEPRINT_REPO} "${tmpDir}"`, {
      stdio: 'pipe',
      timeout: 60000,
    })

    // Step 2: Run init.sh
    execSync(`bash "${join(tmpDir, 'init.sh')}"`, {
      stdio: 'inherit',
      cwd: targetDir,
      env: { ...process.env },
    })

    console.log(`\n  Project "${projectName}" created at ${targetDir}`)
    console.log(`\n  Next: cd ${projectName} && npm install && npm test`)
    console.log('  Or copy-paste the LLM prompt shown above to Claude/GPT/Gemini.\n')
  } finally {
    // Cleanup blueprint clone
    execSync(`rm -rf "${tmpDir}"`, { stdio: 'pipe' })
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
