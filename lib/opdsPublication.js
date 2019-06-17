const { Agent, Edition } = require('./opdsComponents')


class Publication {
  constructor(source, req) {
    this.source = source
    this.request = req
    this.links = []
    this.metadata = {
      '@type': 'http://schema.org/EBook',
    }
  }

  setMetadata() {
    Object.assign(this.metadata, {
      title: this.source.title,
      sortAs: this.source.sort_title,
      subtitle: this.source.sub_title,
      alternateName: this.source.alt_titles ? this.setAltTitles() : [],
      modified: this.source.date_modified,
      description: this.source.summary,
      subjects: this.source.subjects ? this.setSubjects() : [],
      author: this.source.agents ? this.setAgents('author') : [],
      editor: this.source.agents ? this.setAgents('editor') : [],
      translator: this.source.agents ? this.setAgents('translator') : [],
      illustrator: this.source.agents ? this.setAgents('illustrator') : [],
      contributor: this.source.agents ? this.setContributors() : [],
      language: this.source.language ? this.setLanguage() : [],
      identifier: this.source.identifiers ? this.setIdentifiers() : [],
      editions: this.source.instances ? this.setInstances() : [],
    })
  }

  setInstances() {
    return this.source.instances.map((inst) => {
      const edition = new Edition(inst)
      return edition.opdsObject
    })
  }

  setLanguage() {
    return this.source.language.map(lang => lang.iso_2)
  }

  setIdentifiers() {
    return this.source.identifiers.map(id => `${id.id_type}|${id.identifier}`)
  }

  setContributors() {
    const otherRoles = ['author', 'editor', 'illustrator', 'translator']
    return this.source.agents.filter(agent => agent.roles.filter(role => !otherRoles.includes(role)).length > 0).map((agent) => {
      const agentRec = new Agent()
      agentRec.addMetadata(agent)
      agentRec.role = agent.roles
      return agentRec.opdsObject
    })
  }

  setAgents(role) {
    return this.source.agents.filter(agent => agent.roles.indexOf(role) > -1).map((agent) => {
      const agentRec = new Agent()
      agentRec.addMetadata(agent)
      return agentRec.opdsObject
    })
  }

  setSubjects() {
    return this.source.subjects.map((subj) => {
      return {
        name: subj.subject,
        scheme: subj.authority,
        code: subj.uri,
      }
    })
  }

  setAltTitles() {
    return this.source.alt_titles.map(alt => alt)
  }

  setLinks() {
    this.links.push({
      ref: 'self',
      href: `${this.request.protocol}://${this.request.get('host')}/work/${this.source.uuid}`,
      type: 'application/opds+json',
    })
  }

  generateManifest() {
    return {
      metadata: this.metadata,
      links: this.links,
    }
  }
}

module.exports = { Publication }
