export class Database {
  #database: IDBDatabase | null = null

  async open(): Promise<void> {
    if (!this.#database) {
      this.#database = await openDatabase()
    }
  }

  async save(key: string, value: any): Promise<void> {
    this.checkIfDatabaseHasBeenOpened()
    const transaction = this.#database!.transaction("values", "readwrite")
    const objectStore = transaction.objectStore("values")
    await convertRequestToPromise(
      objectStore.put({
        key,
        value,
      }),
    )
  }

  async load(key: string): Promise<any> {
    this.checkIfDatabaseHasBeenOpened()
    const transaction = this.#database!.transaction("values", "readonly")
    const objectStore = transaction.objectStore("values")
    const object = await convertRequestToPromise(objectStore.get(key))
    return object?.value ?? null
  }

  private checkIfDatabaseHasBeenOpened() {
    if (!this.#database) {
      throw new Error(
        "Please open the database with `await database.open()` before calling this method.",
      )
    }
  }
}

async function convertRequestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, onError) => {
    request.addEventListener("success", function (event) {
      resolve((event.target as any).result)
    })
    request.addEventListener("error", function (event) {
      onError(event)
    })
  })
}

async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, onError) => {
    const request = window.indexedDB.open("tilemap-editor")
    request.onupgradeneeded = function (event) {
      const database = (event.target as any).result
      database.createObjectStore("values", {
        keyPath: "key",
      })
    }
    request.onerror = function (event) {
      console.error(event)
      onError(event)
    }
    request.onsuccess = function (event) {
      const database = (event.target as any).result
      resolve(database)
    }
  })
}
