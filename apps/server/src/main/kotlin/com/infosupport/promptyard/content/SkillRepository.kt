package com.infosupport.promptyard.content

import io.quarkus.hibernate.orm.panache.kotlin.PanacheRepository
import jakarta.enterprise.context.ApplicationScoped

@ApplicationScoped
class SkillRepository : PanacheRepository<Skill> {
    fun findBySlug(slug: String): Skill? {
        return find("slug", slug).firstResult()
    }
}
