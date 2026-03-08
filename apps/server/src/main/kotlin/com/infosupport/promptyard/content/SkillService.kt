package com.infosupport.promptyard.content

import com.fasterxml.jackson.databind.ObjectMapper
import io.quarkus.arc.Arc
import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Inject
import jakarta.transaction.Transactional
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.nio.charset.StandardCharsets
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream

@ApplicationScoped
class SkillService {

    @Inject
    lateinit var objectMapper: ObjectMapper

    companion object {
        private const val MAX_FILE_SIZE = 10_485_760L // 10 MB
        private const val MAX_PREVIEW_SIZE = 10_000
        private const val SKILL_MD_FILENAME = "SKILL.md"
    }

    @Transactional
    fun createSkill(request: SubmitSkillRequest): Skill {
        val skill = Skill().apply {
            this.title = request.title
            this.description = request.description
            this.tags = request.tags
            this.slug = generateSlug(request.title)
            this.authorId = 0L // Will be set by resource
            this.createdAt = java.time.Instant.now()
            this.fileCount = 0
            this.fileSize = request.fileSize
            this.fileMetadata = request.fileMetadata
            this.previewContent = request.previewContent
        }

        // Persist the skill to get an ID
        Arc.container().instance(ContentItemRepository::class.java).get().persist(skill)

        return skill
    }

    fun validateZipFile(fileSize: Long, fileMetadata: String): List<String> {
        val errors = mutableListOf<String>()

        if (fileSize > MAX_FILE_SIZE) {
            errors.add("The zip file must be smaller than 10 MB")
        }

        // Parse fileMetadata JSON and check for SKILL.md
        val fileInfos = parseFileMetadata(fileMetadata)
        val hasSkillMd = fileInfos.any { it.fileName == SKILL_MD_FILENAME }
        if (!hasSkillMd) {
            errors.add("The zip file must contain a SKILL.md file at its root")
        }

        return errors
    }

    fun parseZipBytes(zipBytes: ByteArray): List<SkillFileInfo> {
        val result = mutableListOf<SkillFileInfo>()
        val seenFilenames = mutableSetOf<String>()

        ByteArrayInputStream(zipBytes).use { bais ->
            ZipInputStream(bais).use { zis ->
                var entry: ZipEntry? = zis.nextEntry
                while (entry != null) {
                    if (entry.isDirectory) {
                        entry = zis.nextEntry
                        continue
                    }

                    val fileName = entry.name
                    val fileSize = entry.size

                    // Determine if text file
                    val isTextFile = isTextFile(fileName)

                    // Read content for preview (text files only)
                    val content = if (isTextFile) {
                        ByteArrayOutputStream().use { baos ->
                            zis.copyTo(baos)
                            val text = baos.toString(StandardCharsets.UTF_8)
                            // Truncate for preview
                            if (text.length > MAX_PREVIEW_SIZE) {
                                text.substring(0, MAX_PREVIEW_SIZE) + "..."
                            } else {
                                text
                            }
                        }
                    } else {
                        // Skip binary content
                        zis.skip(entry.size)
                        null
                    }

                    result.add(SkillFileInfo(fileName, fileSize, isTextFile, content))

                    entry = zis.nextEntry
                }
            }
        }

        return result
    }

    fun isTextFile(filename: String): Boolean {
        val textExtensions = listOf(".md", ".txt", ".json", ".yml", ".yaml", ".xml", ".html", ".css", ".scss", ".js", ".ts", ".java", ".kt", ".py", ".rb", ".go", ".rs", ".c", ".cpp", ".h", ".hpp")
        val lowercaseFilename = filename.lowercase()
        return textExtensions.any { lowercaseFilename.endsWith(it) }
    }

    fun parseFileMetadata(metadata: String): List<SkillFileInfo> {
        return try {
            objectMapper.readValue(metadata, Array<SkillFileInfo>::class.java).toList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun generateSlug(title: String): String {
        val baseSlug = title
            .lowercase()
            .trim()
            .replace(Regex("[^a-z0-9\\s-]"), "")
            .replace(Regex("\\s+"), "-")
            .replace(Regex("-{2,}"), "-")

        val repository = Arc.container().instance(ContentItemRepository::class.java).get()
        if (!repository.existsBySlugAndContentType(baseSlug, "skill")) {
            return baseSlug
        }

        var counter = 2
        while (true) {
            val candidate = "$baseSlug-$counter"
            if (!repository.existsBySlugAndContentType(candidate, "skill")) {
                return candidate
            }
            counter++
        }
    }
}

data class SkillFileInfo(
    val fileName: String,
    val fileSize: Long,
    val isTextFile: Boolean,
    val content: String?
)
