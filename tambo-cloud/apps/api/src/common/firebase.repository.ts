import { Firestore } from '@google-cloud/firestore';
import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
// import * as serviceAccount from '../../firestore-creds.json';
import { FieldSearchValue, RepositoryInterface } from './repository.interface';

@Injectable()
export class FirebaseRepository<
  E extends object,
  D extends admin.firestore.WithFieldValue<admin.firestore.DocumentData>,
> implements RepositoryInterface<E, D>
{
  db: Firestore;
  collectionName: string;
  private readonly entityConstructor: new () => E;

  constructor(collectionName: string, entityConstructor: new () => E) {
    if (!admin.apps.length) {
      const serviceAccount = getServiceAccountCredentials();

      // Initialize Firebase Admin SDK only if it hasn't been initialized already
      admin.initializeApp({
        credential: admin.credential.cert(
          serviceAccount as admin.ServiceAccount,
        ),
      });
    }

    this.db = admin.firestore();
    this.collectionName = collectionName;
    this.entityConstructor = entityConstructor;
  }

  async create(entityDto: D): Promise<E> {
    const res = await this.db
      .collection(this.collectionName)
      .add({ ...entityDto });
    const entityWithId: E = {
      id: res.id,
      ...(entityDto as unknown as Partial<E>),
    } as E;

    return entityWithId;
  }

  async get(id: string): Promise<E | null> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .doc(id)
      .get();
    if (!snapshot.exists) {
      return null;
    }
    const entity = { ...(snapshot.data() as E), id: snapshot.id };
    this.convertFirestoreTimestampsToDates(entity);
    return this.mapObjectToInstance(entity);
  }

  async getByField(fieldName: string, fieldValue: any): Promise<E | null> {
    const query = this.db
      .collection(this.collectionName)
      .where(fieldName, '==', fieldValue);

    const querySnapshot = await query.get();

    if (querySnapshot.empty) {
      return null;
    }

    // Assuming the field value is unique within the collection
    const snapshot = querySnapshot.docs[0];
    const entity = { ...(snapshot.data() as E), id: snapshot.id };
    this.convertFirestoreTimestampsToDates(entity);
    return this.mapObjectToInstance(entity);
  }

  async getByFields(searchValues: FieldSearchValue[]): Promise<E | null> {
    let query: FirebaseFirestore.CollectionReference | FirebaseFirestore.Query =
      this.db.collection(this.collectionName);
    searchValues.forEach((searchValue) => {
      query = query.where(searchValue.fieldName, '==', searchValue.fieldValue);
    });

    const querySnapshot = await query.get();

    if (querySnapshot.empty) {
      return null;
    }

    // Assuming the field value is unique within the collection
    const snapshot = querySnapshot.docs[0];
    const entity = { ...(snapshot.data() as E), id: snapshot.id };
    this.convertFirestoreTimestampsToDates(entity);
    return this.mapObjectToInstance(entity);
  }

  async getAllByField(fieldName: string, fieldValue: any): Promise<E[]> {
    const query = this.db
      .collection(this.collectionName)
      .where(fieldName, '==', fieldValue);

    const querySnapshot = await query.get();

    if (querySnapshot.empty) {
      return [];
    }

    const matchingEntities: E[] = [];

    querySnapshot.forEach((doc) => {
      const entity = { ...(doc.data() as E), id: doc.id };
      this.convertFirestoreTimestampsToDates(entity);
      matchingEntities.push(entity);
    });

    return matchingEntities;
  }

  async getAllByFields(searchValues: FieldSearchValue[]): Promise<E[]> {
    let query: FirebaseFirestore.CollectionReference | FirebaseFirestore.Query =
      this.db.collection(this.collectionName);
    searchValues.forEach((searchValue) => {
      query = query.where(searchValue.fieldName, '==', searchValue.fieldValue);
    });

    const querySnapshot = await query.get();

    if (querySnapshot.empty) {
      return [];
    }

    const matchingEntities: E[] = [];

    querySnapshot.forEach((doc) => {
      const entity = { ...(doc.data() as E), id: doc.id };
      this.convertFirestoreTimestampsToDates(entity);
      matchingEntities.push(entity);
    });

    return matchingEntities;
  }

  async getAll(): Promise<E[]> {
    const ref = this.db.collection(this.collectionName);
    const snapshot = await ref.get();
    const allEntities: E[] = [];
    snapshot.forEach((entity) => {
      const entityData = entity.data() as E;
      const entityWithId = { ...entityData, id: entity.id };
      // Apply the date conversion function to all date fields
      this.convertFirestoreTimestampsToDates(entityWithId);
      allEntities.push(entityWithId);
    });
    return allEntities;
  }

  async update(id: string, entityDto: D): Promise<E | null> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .doc(id)
      .get();
    if (!snapshot.exists) {
      return null;
    }

    const updateData: { [key: string]: any } = entityDto;
    await snapshot.ref.update({ ...updateData });

    const updatedEntity: E = {
      id: id,
      ...(entityDto as Partial<E>),
    } as E;
    return updatedEntity;
  }

  async delete(id: string): Promise<boolean> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .doc(id)
      .get();
    if (!snapshot.exists) {
      return false;
    }

    await snapshot.ref.delete();
    return true;
  }

  mapObjectToInstance(data: E) {
    const entityInstance = new this.entityConstructor();
    Object.assign(entityInstance, data);
    return entityInstance;
  }

  convertFirestoreTimestampsToDates(entity: Record<string, any>): void {
    for (const key in entity) {
      if (
        entity.hasOwnProperty(key) &&
        entity[key] instanceof admin.firestore.Timestamp
      ) {
        entity[key] = new Date(entity[key].seconds * 1000);
      }
    }
  }
}

function getServiceAccountCredentials(): admin.ServiceAccount {
  // first try GOOGLE_APPLICATION_CREDENTIALS_JSON
  // then try GOOGLE_APPLICATION_CREDENTIALS

  const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (serviceAccount) {
    return JSON.parse(serviceAccount);
  }

  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountPath) {
    return require(serviceAccountPath);
  }

  throw new Error('No service account credentials found');
}
