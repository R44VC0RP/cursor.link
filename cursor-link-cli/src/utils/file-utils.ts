import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';

export interface CursorRule {
  filename: string;
  title: string;
  content: string;
  ruleType: 'always' | 'intelligent' | 'specific' | 'manual';
  alwaysApply?: boolean;
}

export class FileManager {
  private getCursorRulesDir(): string {
    const cwd = process.cwd();
    const rulesDir = path.join(cwd, '.cursor', 'rules');
    
    if (!fs.existsSync(rulesDir)) {
      throw new Error(`Cursor rules directory not found: ${rulesDir}\nMake sure you're in a project with .cursor/rules/ directory.`);
    }
    
    return rulesDir;
  }

  async findRuleFiles(): Promise<string[]> {
    const rulesDir = this.getCursorRulesDir();
    const pattern = path.join(rulesDir, '*.mdc').replace(/\\/g, '/');
    
    try {
      const files = await glob(pattern);
      return files.sort();
    } catch (error) {
      throw new Error(`Error finding rule files: ${error}`);
    }
  }

  parseRuleFile(filePath: string): CursorRule {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const filename = path.basename(filePath, '.mdc');
      
      // Parse frontmatter and content
      const lines = content.split('\n');
      let frontmatterEnd = -1;
      let alwaysApply = false;
      
      // Check for frontmatter
      if (lines[0] === '---') {
        for (let i = 1; i < lines.length; i++) {
          if (lines[i] === '---') {
            frontmatterEnd = i;
            break;
          }
          
          // Parse alwaysApply setting
          if (lines[i].includes('alwaysApply:')) {
            const match = lines[i].match(/alwaysApply:\s*(true|false)/);
            if (match) {
              alwaysApply = match[1] === 'true';
            }
          }
        }
      }
      
      // Extract content (skip frontmatter if present)
      const actualContent = lines.slice(frontmatterEnd + 1).join('\n').trim();
      
      // Extract title from first heading or use filename
      let title = filename;
      const titleMatch = actualContent.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
      
      // Determine rule type based on alwaysApply flag
      const ruleType = alwaysApply ? 'always' : 'manual';
      
      return {
        filename,
        title,
        content: actualContent,
        ruleType,
        alwaysApply,
      };
    } catch (error) {
      throw new Error(`Error parsing rule file ${filePath}: ${error}`);
    }
  }

  async getAllRules(): Promise<CursorRule[]> {
    const files = await this.findRuleFiles();
    const rules: CursorRule[] = [];
    
    for (const file of files) {
      try {
        const rule = this.parseRuleFile(file);
        rules.push(rule);
      } catch (error) {
        console.warn(chalk.yellow(`Warning: Failed to parse ${file}: ${error}`));
      }
    }
    
    return rules;
  }

  async writeRuleFile(rule: { filename: string; title: string; content: string; alwaysApply?: boolean }): Promise<void> {
    const rulesDir = this.getCursorRulesDir();
    const filePath = path.join(rulesDir, `${rule.filename}.mdc`);
    
    // Create frontmatter
    const frontmatter = [
      '---',
      `alwaysApply: ${rule.alwaysApply || false}`,
      '---',
      ''
    ].join('\n');
    
    // Ensure content starts with title if it doesn't already
    let content = rule.content;
    if (!content.startsWith('#')) {
      content = `# ${rule.title}\n\n${content}`;
    }
    
    const fullContent = frontmatter + content;
    
    try {
      fs.writeFileSync(filePath, fullContent, 'utf8');
    } catch (error) {
      throw new Error(`Error writing rule file ${filePath}: ${error}`);
    }
  }

  createRulesDir(): void {
    const cwd = process.cwd();
    const cursorDir = path.join(cwd, '.cursor');
    const rulesDir = path.join(cursorDir, 'rules');
    
    if (!fs.existsSync(cursorDir)) {
      fs.mkdirSync(cursorDir, { recursive: true });
    }
    
    if (!fs.existsSync(rulesDir)) {
      fs.mkdirSync(rulesDir, { recursive: true });
    }
  }

  ruleFileExists(filename: string): boolean {
    const rulesDir = this.getCursorRulesDir();
    const filePath = path.join(rulesDir, `${filename}.mdc`);
    return fs.existsSync(filePath);
  }
}
