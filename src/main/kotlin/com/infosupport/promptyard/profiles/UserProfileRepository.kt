package com.infosupport.promptyard.profiles

import io.quarkus.hibernate.orm.panache.kotlin.PanacheRepository
import io.quarkus.hibernate.orm.panache.kotlin.PanacheRepositoryBase
import jakarta.enterprise.context.ApplicationScoped

@ApplicationScoped
class UserProfileRepository : PanacheRepository<com.infosupport.promptyard.profiles.UserProfile> {
    fun existsBySlug(slug: String): Boolean {
        return count("slug", slug) > 0
    }

    fun findBySubjectName(subjectName: String): com.infosupport.promptyard.profiles.UserProfile? {
        return find(
            "subjectName",
            subjectName
        ).firstResult()
    }

    fun findBySlug(slug: String): com.infosupport.promptyard.profiles.UserProfile? {
        return find("slug", slug).firstResult()
    }
}
