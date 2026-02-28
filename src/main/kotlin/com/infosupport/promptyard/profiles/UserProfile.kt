package com.infosupport.promptyard.profiles

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanion
import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name="user_profile")
class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, columnDefinition = "bigint")
    var id: Long? = null

    @Column(name = "subject_name", nullable = false, columnDefinition = "varchar(500)")
    lateinit var subjectName: String

    @Column(name = "slug", nullable = false, columnDefinition = "varchar(500)")
    lateinit var slug: String

    @Column(name = "full_name", nullable = false, columnDefinition = "varchar(500)")
    lateinit var fullName: String

    @Column(name = "email_address", nullable = false, columnDefinition = "varchar(500)")
    lateinit var emailAddress: String

    @Column(name = "business_unit", nullable = true, columnDefinition = "varchar(500)")
    var businessUnit: String? = null

    @Column(name = "job_title", nullable = true, columnDefinition = "varchar(500)")
    var jobTitle: String? = null

    @Column(name = "privacy_accepted_at", nullable = true, columnDefinition = "timestamp")
    var privacyAcceptedAt: Instant? = null

    @Column(name = "created_at", nullable = false, columnDefinition = "timestamp")
    lateinit var createdAt: Instant

    @Column(name = "modified_at", nullable = true, columnDefinition = "timestamp")
    var modifiedAt: Instant? = null
}