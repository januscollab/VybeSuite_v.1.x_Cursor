import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TransformationReport {
  file: string;
  automaticTransforms: string[];
  needsReview: string[];
}

const NEEDS_REVIEW_COMMENT = '// TODO: Manual review needed for logging';

function createTransformer(fileName: string, report: TransformationReport) {
  const componentName = path.basename(fileName, '.tsx');
  
  return (context: ts.TransformationContext) => {
    const visitor = (node: ts.Node): ts.Node => {
      // Check if this is a console.* call
      if (ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          node.expression.expression.getText() === 'console') {
        
        const method = node.expression.name.getText();
        const args = node.arguments;

        // Simple string literal cases we can automatically transform
        if (args.length > 0 && ts.isStringLiteral(args[0])) {
          const message = args[0].text;
          
          // Skip if it's already been transformed
          if (message.includes('[') && message.includes(']')) {
            return node;
          }

          switch (method) {
            case 'log':
              report.automaticTransforms.push(`${fileName}: Transformed console.log to debug.info`);
              return ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier('debug'),
                  'info'
                ),
                undefined,
                [
                  ts.factory.createStringLiteral(componentName),
                  args[0],
                  ...args.slice(1)
                ]
              );

            case 'error':
              report.automaticTransforms.push(`${fileName}: Transformed console.error to debug.error`);
              return ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier('debug'),
                  'error'
                ),
                undefined,
                [
                  ts.factory.createStringLiteral(componentName),
                  args[0],
                  ...args.slice(1)
                ]
              );

            case 'warn':
              report.automaticTransforms.push(`${fileName}: Transformed console.warn to debug.warn`);
              return ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier('debug'),
                  'warn'
                ),
                undefined,
                [
                  ts.factory.createStringLiteral(componentName),
                  args[0],
                  ...args.slice(1)
                ]
              );
          }
        } else {
          // Complex cases that need manual review
          report.needsReview.push(
            `${fileName}:${(node as any).line}: Complex ${method} call needs review`
          );
          
          // Add a comment above the node
          const comment = ts.factory.createJSDocComment(
            NEEDS_REVIEW_COMMENT,
            [ts.factory.createJSDocText(`Original: ${node.getText()}`)]
          );
          
          return ts.factory.createNodeArray([comment, node]);
        }
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return (node: ts.Node) => ts.visitNode(node, visitor);
  };
}

function addDebugImport(sourceFile: ts.SourceFile): ts.SourceFile {
  const importStatement = `import { debug } from '../utils/debug';\n`;
  
  // Check if debug is already imported
  const hasDebugImport = sourceFile.statements.some(statement => 
    ts.isImportDeclaration(statement) &&
    statement.moduleSpecifier.getText().includes('debug')
  );

  if (!hasDebugImport) {
    const updatedText = importStatement + sourceFile.getText();
    return ts.createSourceFile(
      sourceFile.fileName,
      updatedText,
      sourceFile.languageVersion,
      true
    );
  }

  return sourceFile;
}

function transformFile(filePath: string): TransformationReport {
  const report: TransformationReport = {
    file: filePath,
    automaticTransforms: [],
    needsReview: []
  };

  // Create backup
  const backupPath = filePath + '.backup';
  fs.copyFileSync(filePath, backupPath);

  try {
    const source = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      source,
      ts.ScriptTarget.Latest,
      true
    );

    // Add debug import if needed
    const withImport = addDebugImport(sourceFile);

    // Transform console.* calls
    const result = ts.transform(
      withImport,
      [createTransformer(filePath, report)]
    );

    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const transformedCode = printer.printFile(result.transformed[0] as ts.SourceFile);

    // Write the transformed code back to the file
    fs.writeFileSync(filePath, transformedCode);

    // Remove backup if successful
    fs.unlinkSync(backupPath);
  } catch (error) {
    // Restore from backup if something went wrong
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, filePath);
      fs.unlinkSync(backupPath);
    }
    console.error(`Error transforming ${filePath}:`, error);
  }

  return report;
}

// Main execution
function main() {
  const targetFiles = [
    'src/lib/supabase_fix.ts',
    'src/utils/aiService.ts',
    'src/hooks/useSupabaseStories.ts',
    'src/utils/aiSettings.ts',
    'src/hooks/fixed_supabase_stories.ts'
  ];

  console.log('Starting transformation for target files...');
  const reports: TransformationReport[] = [];

  for (const relativePath of targetFiles) {
    const fullPath = path.join(process.cwd(), relativePath);
    if (fs.existsSync(fullPath)) {
      console.log(`\nTransforming ${relativePath}...`);
      const report = transformFile(fullPath);
      reports.push(report);
    } else {
      console.log(`File not found: ${relativePath}`);
    }
  }

  // Print summary
  console.log('\nTransformation Summary:');
  console.log('=====================\n');
  
  reports.forEach(report => {
    console.log(`\nFile: ${report.file}\n`);
    if (report.automaticTransforms.length > 0) {
      console.log('Automatic Transformations:');
      report.automaticTransforms.forEach(t => console.log(`✓ ${t}`));
    }
    if (report.needsReview.length > 0) {
      console.log('\nNeeds Manual Review:');
      report.needsReview.forEach(r => console.log(`! ${r}`));
    }
  });
}

main();