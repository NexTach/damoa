package io.github.snowykte0426.damoa.storage

interface StorageService {
    /** Uploads bytes and returns the generated object key. */
    fun upload(bytes: ByteArray, contentType: String, extension: String): String

    /** Returns (bytes, contentType), or null when the object is missing. */
    fun download(key: String): Pair<ByteArray, String>?

    fun delete(key: String)
}
