<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <title>Course Assessment Report</title>
    <style>
        .label {
            display: inline-block;
            margin-bottom: 6px;
            vertical-align: top;
            margin-right: 3px;
        }

        .checkbox {
            display: inline-block;
            width: 12px;
            height: 12px;
            border: 1px solid #000;
            vertical-align: middle;
        }

        .checkbox.checked {
            background: #000;
        }

        body {
            font-family: Helvetica, Arial, sans-serif;
            font-size: 11px;
        }

        .header {
            background: #000;
            color: #fff;
            font-weight: bold;
            padding: 6px;
            font-size: 13px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
        }

        th, td {
            border: 1px solid #000;
            padding: 6px;
            vertical-align: top;
        }

        th {
            text-align: center;
            font-weight: bold;
        }

        .center { text-align: center; }
        .left   { text-align: left; }
        .red    { color: red;   font-weight: bold; }
        .green  { color: green; font-weight: bold; }

        .section-row {
            font-weight: bold;
            background: #f5f5f5;
        }

        .meta-label {
            width: 25%;
            font-weight: bold;
        }
    </style>
</head>
<body>

{{-- ===========================
     I. ASSESSMENT BACKGROUND
=========================== --}}
<div class="header">I. ASSESSMENT BACKGROUND</div>

<table>
    <tr>
        <td class="meta-label">Performing Agent</td>
        <td>Dean's Office, Assessment Officer</td>
    </tr>

    <tr>
        <td class="meta-label">Academic Year</td>
        <td>{{ $academicYear }}</td>
    </tr>

    <tr>
        <td class="meta-label">Semester(s)</td>
        <td>{{ implode(', ', $data['semesters']) ?: '-' }}</td>
    </tr>

    <tr>
        <td class="meta-label">Campus</td>
        <td>{{ implode(', ', $data['campuses']) ?: '-' }}</td>
    </tr>

    <tr>
        <td class="meta-label">Assessment Method</td>
        <td>
            @foreach($data['all_methods'] as $method)
                @php $checked = isset($data['methods_used'][$method['name']]); @endphp
                <span class="label">
                    <span class="checkbox {{ $checked ? 'checked' : '' }}"></span>
                    {{ $method['name'] }}
                </span>
            @endforeach
        </td>
    </tr>

    <tr>
        <td class="meta-label">Assessment Context</td>
        <td>
            @foreach($data['all_courses'] as $courseCode)
                @php $checked = isset($data['courses_with_subs'][$courseCode]); @endphp
                <span class="label">
                    <span class="checkbox {{ $checked ? 'checked' : '' }}"></span>
                    {{ $courseCode }}
                </span>
            @endforeach
        </td>
    </tr>
</table>

<br>

{{-- ===========================
     II. PROGRAM EDUCATIONAL OBJECTIVES
=========================== --}}
<div class="header">II. ASSESSED PROGRAM EDUCATIONAL OBJECTIVE(S)</div>

<table>
    <tbody>
        <tr class="section-row">
            <td style="width:5%"><span class="checkbox"></span></td>
            <td>
                <strong>PEO.1:</strong>
                Graduates shall be prepared for computer science related careers,
                locally and abroad, with a broad knowledge of the computing field,
                related principles, tools, and theories.
            </td>
        </tr>
        <tr class="section-row">
            <td><span class="checkbox"></span></td>
            <td>
                <strong>PEO.2:</strong>
                Graduates shall be committed to life-long learning, be capable to
                work efficiently in teams, and possess effective communication skills.
            </td>
        </tr>
        <tr class="section-row">
            <td><span class="checkbox"></span></td>
            <td>
                <strong>PEO.3:</strong>
                Graduates shall be aware of cultural, social, legal, and ethical
                issues inherent in the discipline of computing.
            </td>
        </tr>
    </tbody>
</table>

<br>

{{-- ===========================
     III. ASSESSED STUDENT LEARNING OUTCOMES
=========================== --}}
<div class="header">III. ASSESSED STUDENT LEARNING OUTCOME(S)</div>

<table>
    <tbody>
        @foreach($data['so_list'] as $so)
        <tr class="section-row">
            <td style="width:5%"><span class="checkbox"></span></td>
            <td>
                <strong>{{ $so['code'] }}:</strong>
                {{ $so['description'] }}
            </td>
        </tr>
        @endforeach
    </tbody>
</table>

<br>

{{-- ===========================
     IV. ASSESSMENT SUMMARY
=========================== --}}
<div class="header">IV. STUDENT LEARNING OUTCOMES ASSESSMENT SUMMARY</div>

<table>
    <thead>
        <tr>
            <th style="width:20%">Student Learning Outcomes</th>
            <th style="width:14%">Source of Assessment</th>
            <th style="width:12%">Assessment Method</th>
            <th style="width:8%">Number of Students</th>
            <th style="width:8%">Average Score</th>
            <th style="width:10%">Percentage Met</th>
            <th style="width:10%">Performance Standard Used</th>
            <th style="width:8%">Target</th>
            <th style="width:10%">Data Interpretation</th>
        </tr>
    </thead>

    <tbody>
        @forelse($data['report_rows'] as $row)
            @foreach($row['slos'] as $soCode => $so)

            <tr class="section-row">
                <td colspan="9">
                    <strong>{{ $soCode }}: {{ $so['description'] }}</strong>
                </td>
            </tr>

            @foreach($so['pcs'] as $pc)
                @php
                    $percent = $pc['percent'];
                    $meets   = $percent !== null && $percent >= 70;
                    $colorClass = $meets ? 'green' : 'red';
                    $interpretation = $meets ? 'Target Met' : 'Target Not Met';
                @endphp
                <tr>
                    <td>
                        <strong>{{ $pc['pc_code'] }}</strong><br>
                        {{ $pc['description'] }}
                    </td>

                    <td class="center">
                        {{ $row['meta']['course_code'] }}<br>
                        {{ $row['meta']['instructor'] }}<br>
                        {{ $row['meta']['semester'] }}
                    </td>

                    <td class="center">
                        @if(!empty($pc['methods']))
                            {{ implode(', ', $pc['methods']) }}
                        @else
                            -
                        @endif
                    </td>

                    <td class="center">
                        {{ $row['meta']['nb_of_students'] ?? '-' }}
                    </td>

                    <td class="center">
                        {{ $pc['score'] !== null ? $pc['score'] : '-' }}
                    </td>

                    <td class="center {{ $colorClass }}">
                        {{ $percent !== null ? $percent . '%' : '-' }}
                    </td>

                    <td class="center">{{ $pc['performance_standard'] ?? 70 }}</td>

                    <td class="center">
                        70%<br>Meeting<br>Performance<br>Standard
                    </td>

                    <td class="center {{ $colorClass }}">
                        {{ $interpretation }}
                    </td>
                </tr>
            @endforeach

            @endforeach
        @empty
            <tr>
                <td colspan="9" class="center">No submission data found for this academic year.</td>
            </tr>
        @endforelse
    </tbody>
</table>

<br>

{{-- ===========================
     V. INSTRUCTORS' PROPOSED IMPROVEMENTS
=========================== --}}
<div class="header">V. INSTRUCTORS' PROPOSED IMPROVEMENTS</div>

<table>
    <thead>
        <tr>
            <th style="width:30%">Course</th>
            <th style="width:20%">Instructor</th>
            <th style="width:50%">Proposed Improvements to the Course Content</th>
        </tr>
    </thead>

    <tbody>
        @forelse($data['instructor_improvements'] as $imp)
        <tr>
            <td>
                <strong>{{ $imp['course_code'] }}</strong><br>
                {{ $imp['course_name'] }}<br>
                <span style="color:#555">{{ $imp['semester'] }}</span>
            </td>
            <td class="center">{{ $imp['instructor'] }}</td>
            <td>{{ $imp['text'] }}</td>
        </tr>
        @empty
        <tr>
            <td colspan="3" class="center">No improvements submitted.</td>
        </tr>
        @endforelse
    </tbody>
</table>

</body>
</html>
