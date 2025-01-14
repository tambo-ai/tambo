export interface FieldSearchValue {
  fieldName: string;
  fieldValue: string;
}

export interface RepositoryInterface<E, D> {
  create(entityDto: D): Promise<E>;
  get(id: string): Promise<E | null>;
  getByField(fieldName: string, fieldValue: any): Promise<E | null>;
  getByFields(searchValues: FieldSearchValue[]): Promise<E | null>;
  getAllByField(fieldName: string, fieldValue: any): Promise<E[]>;
  getAllByFields(searchValues: FieldSearchValue[]): Promise<E[]>;
  getAll(): Promise<E[]>;
  update(id: string, entityDto: D): Promise<E | null>;
  delete(id: string): Promise<boolean>;
}
