/* eslint-disable no-underscore-dangle */
class Agent {
  constructor() {
    this.type = 'https://schema.org/Person'
    this._role = null
  }

  addMetadata(rec) {
    this.name = rec.name
    this.sortAs = rec.sort_name
    this.role = rec.role
    this.identifier = rec.viaf ? `http://viaf.org/viaf/${rec.viaf}` : null
    this.addAliases(rec.aliases)
    this.addDate(rec, 'birth_date', 'birthDate')
    this.addDate(rec, 'death_date', 'deathDate')
  }

  addAliases(aliases) {
    this.additionalName = aliases
  }

  addDate(rec, dateType, schemaDate) {
    this[schemaDate] = rec[`${dateType}_display`]
  }

  set role(role) {
    this._role = role
  }

  get opdsObject() {
    return {
      '@type': this.type,
      name: this.name,
      sortAs: this.sortAs,
      role: this._role,
      identifier: this.identifier,
      additionalName: this.additionalName,
      birthDate: this.birthDate,
      deathDate: this.deathDate,
    }
  }
}


class Edition {
  constructor(instance) {
    this.type = 'https://schema.org/EBook'
    this.instance = instance
    this.links = []

    this.addMetadata()
    try {
      this.addLinks()
    } catch (err) {
      // Nothing happens, this is a valid case
    }
  }

  addMetadata() {
    this.title = this.instance.title
    this.sortAs = this.instance.sort_title
    this.subtitle = this.instance.subtitle
    const editionInfo = []
    if (this.instance.edition) { editionInfo.push(this.instance.edition) }
    if (this.instance.edition_statement) { editionInfo.push(this.instance.edition_statement) }
    this.bookEdition = editionInfo.join(' -- ')
    this.bookFormat = this.instance.extent
    this.position = this.instance.volume
    this.description = this.instance.table_of_contents


    this.addRights()
    this.addPubEvent()
    this.setLanguage()
  }

  addLinks() {
    if (!this.instance.items) { throw new Error('No items associated with instance') }
    this.instance.items.forEach((item) => {
      item.links.forEach((link) => {
        this.links.push({
          href: link.url,
          type: link.media_type,
          rel: 'http://opds-spec.org/acquisition/open-access',
          properties: {
            source: item.source,
            label: link.label,
            local: link.local,
            download: link.download,
            ebook: link.ebook,
            images: link.images,
          },
        })
      })
    })
  }

  addPubEvent() {
    this.publication = {
      publishedBy: this.setAgents('publisher'),
      startDate: this.instance.pub_date_display,
      location: this.instance.pub_place,
    }
  }

  addRights() {
    if (this.instance.rights) {
      const editionRights = this.instance.rights
      editionRights.sort((a, b) => a.determination_date - b.determination_date)
      this.license = editionRights[0].license
      this.copyrightYear = editionRights[0].copyright_date_display
    }
  }

  setAgents(role) {
    if (this.instance.agents) {
      return this.instance.agents.filter(agent => agent.roles.indexOf(role) > -1).map((agent) => {
        const agentRec = new Agent()
        agentRec.addMetadata(agent)
        return agentRec.opdsObject
      })
    }
    return []
  }

  setLanguage() {
    if (this.instance.language) {
      this.language = this.instance.language.map(lang => lang.iso_2)
    }
  }

  get opdsObject() {
    return {
      metadata: {
        '@type': this.type,
        name: this.name,
        sortAs: this.sortAs,
        subtitle: this.subtitle,
        bookEdition: this.bookEdition,
        bookFormat: this.bookFormat,
        position: this.position,
        description: this.description,
        publication: this.publication,
        language: this.language,
        license: this.license,
        copyrightYear: this.copyrightYear,
        identifiers: this.identifiers,
      },
      links: this.links,
    }
  }
}

module.exports = { Agent, Edition }