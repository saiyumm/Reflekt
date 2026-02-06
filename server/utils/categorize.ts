/**
 * Server-side auto-categorization — same logic as the frontend version.
 * Used as a fallback when creating updates via the API without a category.
 */

type CategoryId = 'bug_fix' | 'development' | 'improvement' | 'documentation' | 'devops' | 'other';

interface CategoryRule {
  id: CategoryId;
  keywords: string[];
}

const rules: CategoryRule[] = [
  {
    id: 'bug_fix',
    keywords: [
      'fix', 'bug', 'crash', 'error', 'broken', 'issue', 'patch',
      'hotfix', 'resolve', 'resolved', 'debug', 'debugged', 'regression',
      'failing', 'failed', 'not working', '500', '404', 'exception',
    ],
  },
  {
    id: 'devops',
    keywords: [
      'deploy', 'deployed', 'ci', 'cd', 'pipeline', 'docker', 'config',
      'infra', 'infrastructure', 'env', 'environment', 'server', 'nginx',
      'aws', 'vercel', 'netlify', 'hosting', 'ssl', 'dns', 'domain',
      'kubernetes', 'k8s', 'terraform', 'ansible', 'github actions',
    ],
  },
  {
    id: 'documentation',
    keywords: [
      'doc', 'docs', 'documentation', 'readme', 'guide', 'comment',
      'comments', 'wiki', 'jsdoc', 'tsdoc', 'changelog', 'tutorial',
      'api docs', 'swagger', 'storybook',
    ],
  },
  {
    id: 'improvement',
    keywords: [
      'improve', 'improved', 'update', 'updated', 'enhance', 'enhanced',
      'refactor', 'refactored', 'optimize', 'optimized', 'upgrade',
      'upgraded', 'cleanup', 'clean up', 'polish', 'polished', 'tweak',
      'tweaked', 'simplify', 'simplified', 'restructure', 'migration',
    ],
  },
  {
    id: 'development',
    keywords: [
      'develop', 'developed', 'code', 'coded', 'build', 'built',
      'scaffold', 'setup', 'set up', 'integrate', 'integrated',
      'working on', 'publish', 'published', 'launch', 'launched',
      'release', 'released', 'go live', 'ship', 'shipped', 'post',
      'blog', 'article', 'content', 'page', 'draft', 'wip',
      'in progress', 'under development', 'prototype', 'poc', 'started',
      'add', 'added', 'new', 'create', 'created', 'implement',
      'implemented', 'feature', 'introduce', 'introduced', 'design',
      'designed', 'ui', 'ux', 'style', 'styled', 'layout', 'responsive',
      'css', 'figma', 'mockup', 'component', 'hook', 'api', 'endpoint',
      'route', 'modal', 'form', 'table', 'chart', 'animation',
    ],
  },
];

export function categorize(
  title: string,
  description?: string | null,
): { category: CategoryId; confidence: number } {
  const titleLower = (title || '').toLowerCase();
  const descLower = (description || '').toLowerCase();

  let bestCategory: CategoryId = 'other';
  let bestScore = 0;

  for (const rule of rules) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (titleLower.includes(kw)) score += 2;
      else if (descLower.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = rule.id;
    }
  }

  const confidence = Math.min(1, bestScore / 4);
  if (confidence < 0.25) return { category: 'other', confidence: 0 };
  return { category: bestCategory, confidence };
}
