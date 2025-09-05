import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

interface DynamoDBKey {
  [key: string]: string | number;
}

interface DynamoDBItem {
  [key: string]: any;
}

interface UpdateData {
  [key: string]: any;
}

class DatabaseError extends Error {
  constructor(message: string, public readonly operation: string, public readonly cause?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

class DynamoDBService {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(client: DynamoDBDocumentClient, tableName: string) {
    if (!tableName) {
      throw new Error('Table name is required');
    }
    this.client = client;
    this.tableName = tableName;
  }

  async getItem<T = DynamoDBItem>(key: DynamoDBKey): Promise<T | null> {
    try {
      const result = await this.client.send(
        new GetCommand({
          TableName: this.tableName,
          Key: key,
        })
      );
      return (result.Item as T) || null;
    } catch (error) {
      throw new DatabaseError(
        `Failed to get item from ${this.tableName}`,
        'getItem',
        error as Error
      );
    }
  }

  async putItem<T = DynamoDBItem>(item: T): Promise<T> {
    try {
      await this.client.send(
        new PutCommand({
          TableName: this.tableName,
          Item: item,
        })
      );
      return item;
    } catch (error) {
      throw new DatabaseError(
        `Failed to put item in ${this.tableName}`,
        'putItem',
        error as Error
      );
    }
  }

  async updateItem<T = DynamoDBItem>(
    key: DynamoDBKey,
    updateData: UpdateData
  ): Promise<T | null> {
    const validUpdates = Object.entries(updateData).filter(
      ([, value]) => value !== undefined && value !== null
    );

    if (validUpdates.length === 0) {
      throw new DatabaseError('No valid fields provided for update', 'updateItem');
    }

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    validUpdates.forEach(([field, value]) => {
      const attributeName = `#${field}`;
      const attributeValue = `:${field}`;
      updateExpressions.push(`${attributeName} = ${attributeValue}`);
      expressionAttributeNames[attributeName] = field;
      expressionAttributeValues[attributeValue] = value;
    });

    try {
      const result = await this.client.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: key,
          UpdateExpression: `SET ${updateExpressions.join(', ')}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: 'ALL_NEW',
        })
      );
      return (result.Attributes as T) || null;
    } catch (error) {
      throw new DatabaseError(
        `Failed to update item in ${this.tableName}`,
        'updateItem',
        error as Error
      );
    }
  }

  async deleteItem(key: DynamoDBKey): Promise<boolean> {
    try {
      await this.client.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: key,
        })
      );
      return true;
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete item from ${this.tableName}`,
        'deleteItem',
        error as Error
      );
    }
  }

  async scanTable<T = DynamoDBItem>(limit?: number): Promise<T[]> {
    try {
      const result = await this.client.send(
        new ScanCommand({
          TableName: this.tableName,
          ...(limit && { Limit: limit }),
        })
      );
      return (result.Items as T[]) || [];
    } catch (error) {
      throw new DatabaseError(
        `Failed to scan ${this.tableName}`,
        'scanTable',
        error as Error
      );
    }
  }
}

const region = process.env.GURUDWARA_AWS_REGION || 'eu-north-1';
const GURUDWARA_EVENTS_TABLE = process.env.GURUDWARA_EVENTS_DB!;
const GURUDWARA_TABLE = process.env.GURUDWARA_DB!;

if (!GURUDWARA_EVENTS_TABLE || !GURUDWARA_TABLE) {
  throw new Error('Required environment variables are missing');
}

const ddbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region })
);

export const gurudwaraEventsDB = new DynamoDBService(ddbClient, GURUDWARA_EVENTS_TABLE);
export const gurudwaraDB = new DynamoDBService(ddbClient, GURUDWARA_TABLE);
export { DynamoDBService, DatabaseError };
export type { DynamoDBKey, DynamoDBItem, UpdateData };
