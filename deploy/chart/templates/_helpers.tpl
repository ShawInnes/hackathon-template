{{/*
App name — defaults to .Values.appName, falls back to the release name.
*/}}
{{- define "app.name" -}}
{{- default .Release.Name .Values.appName -}}
{{- end -}}

{{/*
Common labels applied to every resource.
*/}}
{{- define "app.labels" -}}
app.kubernetes.io/name: {{ include "app.name" . }}
app: {{ include "app.name" . }}
{{- end -}}

{{/*
Namespace every resource is created in.
*/}}
{{- define "app.namespace" -}}
{{- .Release.Namespace -}}
{{- end -}}
