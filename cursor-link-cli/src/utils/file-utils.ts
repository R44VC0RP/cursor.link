import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';

export interface CursorRule {
  filename: string;
  title: string;
  content: string;
  type: 'rule' | 'command';
  ruleType: 'always' | 'intelligent' | 'specific' | 'manual';
  alwaysApply?: boolean;
}

export class FileManager {
  private getCursorDirs(): { rulesDir: string; commandsDir: string } {
    const cwd = process.cwd();
    const cursorDir = path.join(cwd, '.cursor');
    const rulesDir = path.join(cursorDir, 'rules');
    const commandsDir = path.join(cursorDir, 'commands');
    
    return { rulesDir, commandsDir };
  }

  private getCursorRulesDir(): string {
    const { rulesDir } = this.getCursorDirs();
    
    if (!fs.existsSync(rulesDir)) {
      throw new Error(`Cursor rules directory not found: ${rulesDir}\nMake sure you're in a project with .cursor/rules/ directory.`);
    }
    
    return rulesDir;
  }

  async findRuleFiles(): Promise<string[]> {
    const { rulesDir, commandsDir } = this.getCursorDirs();
    const files: string[] = [];
    
    try {
      // Find rules files
      if (fs.existsSync(rulesDir)) {
        const rulesPattern = path.join(rulesDir, '*.mdc').replace(/\\/g, '/');
        const ruleFiles = await glob(rulesPattern);
        files.push(...ruleFiles);
      }
      
      // Find command files
      if (fs.existsSync(commandsDir)) {
        const commandsPattern = path.join(commandsDir, '*.md').replace(/\\/g, '/');
        const commandFiles = await glob(commandsPattern);
        files.push(...commandFiles);
      }
      
      return files.sort();
    } catch (error) {
      throw new Error(`Error finding rule files: ${error}`);
    }
  }

  parseRuleFile(filePath: string): CursorRule {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { rulesDir, commandsDir } = this.getCursorDirs();
      
      // Determine type based on file location
      const isCommand = filePath.includes(commandsDir) || filePath.endsWith('.md');
      const type: 'rule' | 'command' = isCommand ? 'command' : 'rule';
      
      // Get filename without extension
      const extension = isCommand ? '.md' : '.mdc';
      const filename = path.basename(filePath, extension);
      
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
        type,
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

  async writeRuleFile(rule: { filename: string; title: string; content: string; type?: 'rule' | 'command'; alwaysApply?: boolean }): Promise<void> {
    const { rulesDir, commandsDir } = this.getCursorDirs();
    const isCommand = rule.type === 'command';
    const targetDir = isCommand ? commandsDir : rulesDir;
    const extension = isCommand ? '.md' : '.mdc';
    const filePath = path.join(targetDir, `${rule.filename}${extension}`);
    
    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
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
    const commandsDir = path.join(cursorDir, 'commands');
    
    if (!fs.existsSync(cursorDir)) {
      fs.mkdirSync(cursorDir, { recursive: true });
    }
    
    if (!fs.existsSync(rulesDir)) {
      fs.mkdirSync(rulesDir, { recursive: true });
    }
    
    if (!fs.existsSync(commandsDir)) {
      fs.mkdirSync(commandsDir, { recursive: true });
    }
  }

  ruleFileExists(filename: string, type: 'rule' | 'command' = 'rule'): boolean {
    const { rulesDir, commandsDir } = this.getCursorDirs();
    const isCommand = type === 'command';
    const targetDir = isCommand ? commandsDir : rulesDir;
    const extension = isCommand ? '.md' : '.mdc';
    const filePath = path.join(targetDir, `${filename}${extension}`);
    return fs.existsSync(filePath);
  }
}
