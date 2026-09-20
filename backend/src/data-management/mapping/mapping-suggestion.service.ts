import { ImportColumnDefinition, ImportMappingField, TransformationType } from '@shared/types/index';

export interface ColumnSuggestion {
  fileColumn: string;
  targetColumn?: string;
  confidence: 'EXACT' | 'HIGH' | 'MEDIUM' | 'NONE';
  suggestedTransformation?: TransformationType;
  status: 'MAPPED' | 'REVIEW' | 'UNMAPPED';
}

export class MappingSuggestionService {
  private static normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Suggests mappings for all headers of an uploaded sheet based on target column definitions.
   */
  public static suggestMappings(
    fileHeaders: string[],
    targetColumns: ImportColumnDefinition[]
  ): ColumnSuggestion[] {
    const suggestions: ColumnSuggestion[] = [];
    const usedTargets = new Set<string>();

    for (const rawHeader of fileHeaders) {
      const normalizedHeader = this.normalizeString(rawHeader);
      let matchedTarget: ImportColumnDefinition | null = null;
      let confidence: 'EXACT' | 'HIGH' | 'MEDIUM' | 'NONE' = 'NONE';
      let suggestedTransformation: TransformationType | undefined;

      // 1. Check exact match on column name or label
      for (const col of targetColumns) {
        if (usedTargets.has(col.name)) continue;

        const normName = this.normalizeString(col.name);
        const normLabel = this.normalizeString(col.label);

        if (normalizedHeader === normName || normalizedHeader === normLabel) {
          matchedTarget = col;
          confidence = 'EXACT';
          break;
        }
      }

      // 2. Check aliases if no exact match
      if (!matchedTarget) {
        for (const col of targetColumns) {
          if (usedTargets.has(col.name)) continue;

          if (col.aliases) {
            for (const alias of col.aliases) {
              const normAlias = this.normalizeString(alias);
              if (normalizedHeader === normAlias) {
                matchedTarget = col;
                confidence = 'HIGH';
                break;
              }
            }
          }
          if (matchedTarget) break;
        }
      }

      // 3. Check partial similarity / substring if still no match
      if (!matchedTarget) {
        for (const col of targetColumns) {
          if (usedTargets.has(col.name)) continue;

          const normName = this.normalizeString(col.name);
          const normLabel = this.normalizeString(col.label);

          if (normalizedHeader.includes(normName) || normName.includes(normalizedHeader) ||
              normalizedHeader.includes(normLabel) || normLabel.includes(normalizedHeader)) {
            matchedTarget = col;
            confidence = 'MEDIUM';
            break;
          }
        }
      }

      // Assign default transformation according to data type
      if (matchedTarget) {
        usedTargets.add(matchedTarget.name);

        if (matchedTarget.type === 'PHONE') {
          suggestedTransformation = 'NORMALIZE_PHONE';
        } else if (matchedTarget.type === 'DOCUMENT') {
          suggestedTransformation = 'NORMALIZE_DOCUMENT';
        } else if (matchedTarget.type === 'DATE') {
          suggestedTransformation = 'PARSE_DATE';
        } else if (matchedTarget.type === 'CURRENCY') {
          suggestedTransformation = 'PARSE_CURRENCY';
        }

        suggestions.push({
          fileColumn: rawHeader,
          targetColumn: matchedTarget.name,
          confidence,
          suggestedTransformation,
          status: confidence === 'EXACT' || confidence === 'HIGH' ? 'MAPPED' : 'REVIEW'
        });
      } else {
        suggestions.push({
          fileColumn: rawHeader,
          confidence: 'NONE',
          status: 'UNMAPPED'
        });
      }
    }

    return suggestions;
  }

  /**
   * Converts suggestions into usable ImportMappingField array.
   */
  public static toMappingFields(suggestions: ColumnSuggestion[]): ImportMappingField[] {
    return suggestions
      .filter(s => !!s.targetColumn)
      .map(s => ({
        fileColumn: s.fileColumn,
        targetColumn: s.targetColumn!,
        transformation: s.suggestedTransformation
      }));
  }
}
