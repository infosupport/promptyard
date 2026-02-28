package com.infosupport.promptyard.profiles

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class UserProfileSlugGeneratorTest {

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /** Create a generator backed by a stub repository with pre-known existing slugs. */
    private fun generatorWithExistingSlugs(vararg existingSlugs: String): com.infosupport.promptyard.profiles.UserProfileSlugGenerator {
        val existing = existingSlugs.toSet()
        val repository = object : com.infosupport.promptyard.profiles.UserProfileRepository() {
            override fun existsBySlug(slug: String) = slug in existing
        }
        return _root_ide_package_.com.infosupport.promptyard.profiles.UserProfileSlugGenerator()
            .also { it.repository = repository }
    }

    // -------------------------------------------------------------------------
    // Slug formatting
    // -------------------------------------------------------------------------

    @Test
    fun `generates lowercase slug from full name`() {
        val generator = generatorWithExistingSlugs()

        assertEquals("john-doe", generator.generateSlug("John Doe"))
    }

    @Test
    fun `trims leading and trailing whitespace before generating slug`() {
        val generator = generatorWithExistingSlugs()

        assertEquals("jane-doe", generator.generateSlug("  Jane Doe  "))
    }

    @Test
    fun `collapses multiple spaces into a single hyphen`() {
        val generator = generatorWithExistingSlugs()

        assertEquals("john-doe", generator.generateSlug("John   Doe"))
    }

    @Test
    fun `strips special characters from the slug`() {
        val generator = generatorWithExistingSlugs()

        // Special chars are removed; only letters and digits remain
        assertEquals("johndo", generator.generateSlug("John!@#\$%^&*()Do"))
    }

    @Test
    fun `preserves existing hyphens in the name`() {
        val generator = generatorWithExistingSlugs()

        assertEquals("mary-jane-watson", generator.generateSlug("Mary-Jane Watson"))
    }

    @Test
    fun `collapses consecutive hyphens into a single hyphen`() {
        val generator = generatorWithExistingSlugs()

        assertEquals("john-doe", generator.generateSlug("John--Doe"))
    }

    @Test
    fun `preserves digits in the slug`() {
        val generator = generatorWithExistingSlugs()

        assertEquals("r2d2", generator.generateSlug("R2D2"))
    }

    // -------------------------------------------------------------------------
    // Uniqueness / counter logic
    // -------------------------------------------------------------------------

    @Test
    fun `returns base slug when it does not exist yet`() {
        val generator = generatorWithExistingSlugs()

        assertEquals("john-doe", generator.generateSlug("John Doe"))
    }

    @Test
    fun `appends counter 2 when base slug already exists`() {
        val generator = generatorWithExistingSlugs("john-doe")

        assertEquals("john-doe-2", generator.generateSlug("John Doe"))
    }

    @Test
    fun `increments counter until a unique slug is found`() {
        val generator = generatorWithExistingSlugs("john-doe", "john-doe-2", "john-doe-3")

        assertEquals("john-doe-4", generator.generateSlug("John Doe"))
    }
}
